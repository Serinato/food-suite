import { useState, useEffect, useRef } from 'react';
import { db, auth, storage, messaging } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, setDoc, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { getToken, onMessage } from 'firebase/messaging';

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  isVeg?: boolean;
  description: string;
  imageUrl?: string;
  isAvailable: boolean;
  createdAt?: string;
}

export interface RestaurantProfile {
  name: string;
  description: string;
  image: string;
  address: string;
  detailedAddress?: string;
  latitude: number | null;
  longitude: number | null;
  cuisine: string;
  isOpen: boolean;
  phones: string[];
  email: string;
}

export function useMerchantState() {
  const [user, setUser] = useState<User | null>(null);
  const [restaurantId, setRestaurantId] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());

  const [restaurantProfile, setRestaurantProfile] = useState<RestaurantProfile>({
    name: '',
    description: '',
    image: '',
    address: '',
    detailedAddress: '',
    latitude: null,
    longitude: null,
    cuisine: '',
    isOpen: true,
    phones: [],
    email: ''
  });

  // Load Notification Pref
  useEffect(() => {
    const stored = localStorage.getItem('merchant_notifications_enabled');
    if (stored === 'true') {
      setNotifEnabled(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('merchant_notifications_enabled', notifEnabled.toString());
  }, [notifEnabled]);

  const initRing = () => {
    if (!audioRef.current) {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
      audio.volume = 1;
      audio.preload = 'auto';
      audioRef.current = audio;
      audio.play().then(() => {
        audio.pause();
        audio.currentTime = 0;
      }).catch(e => console.log("Silent unlock failed:", e));
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setRestaurantId(currentUser.uid);
        fetchRestaurantProfile(currentUser.uid);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchRestaurantProfile = async (id: string) => {
    try {
      const docRef = doc(db, 'restaurants', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const updatedProfile = {
          name: data.name || '',
          description: data.description || '',
          image: data.image || data.imageUrl || '',
          address: data.address || '',
          detailedAddress: data.detailedAddress || '',
          latitude: data.latitude || null,
          longitude: data.longitude || null,
          cuisine: data.cuisine || '',
          isOpen: data.isOpen !== undefined ? data.isOpen : true,
          phones: data.phones || (data.phone ? [data.phone] : []), // backward compatibility
          email: data.email || ''
        };
        setRestaurantProfile(updatedProfile);
        setRestaurantName(data.name || 'Your Kitchen');

        // Auto-save auth details if missing
        if (auth.currentUser) {
            const updates: any = {};
            if (auth.currentUser.phoneNumber && (!data.phones || data.phones.length === 0) && !data.phone) {
              updates.phones = [auth.currentUser.phoneNumber.replace(/^\+91/, '').trim()];
            }
            if (auth.currentUser.email && !data.email) {
              updates.email = auth.currentUser.email;
            }
            if (auth.currentUser.displayName && !data.name) {
              updates.name = auth.currentUser.displayName;
            }
  
            if (Object.keys(updates).length > 0) {
              await setDoc(docRef, updates, { merge: true });
              setRestaurantProfile(prev => ({ ...prev, ...updates }));
              if (updates.name) setRestaurantName(updates.name);
            }
          }
      } else if (auth.currentUser) {
        const initialData = {
          name: auth.currentUser.displayName || '',
          email: auth.currentUser.email || '',
          phones: auth.currentUser.phoneNumber ? [auth.currentUser.phoneNumber.replace(/^\+91/, '').trim()] : [],
          isOpen: true,
          createdAt: new Date().toISOString()
        };
        await setDoc(docRef, initialData);
        setRestaurantProfile({ ...restaurantProfile, ...initialData });
        if (initialData.name) setRestaurantName(initialData.name);
      }
    } catch (_error) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (restaurantId) {
      const menuRef = collection(db, 'restaurants', restaurantId, 'menu');
      const unsubscribe = onSnapshot(menuRef, (snapshot) => {
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as MenuItem[];
        setMenuItems(items);
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [restaurantId]);

  // FCM Setup
  useEffect(() => {
    if (!user || !notifEnabled || !messaging) return;

    const setupFCM = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const currentToken = await getToken(messaging, {
          vapidKey: 'BIsy3-SjO8Yh4Hn-U4zB8mP6X3p0f8n3k6p9q4n5m6l7k8j9i0h1g2f3e4d5c6b7a',
          serviceWorkerRegistration: registration
        });
        
        if (currentToken) {
          await setDoc(doc(db, 'restaurants', user.uid), { fcmToken: currentToken }, { merge: true });
        }
      } catch (err) {
        console.error('FCM Error:', err);
      }
    };

    setupFCM();
    
    const unsubFCM = onMessage(messaging, (payload) => {
      console.log('Foreground message:', payload);
    });

    return () => unsubFCM();
  }, [user, notifEnabled]);

  const notify = async (order: any) => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.log("Audio play blocked:", e));
    }

    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      const orderShortId = order.id.slice(-4).toUpperCase();
      const title = `New Order #${orderShortId}! 🔔`;
      const options = {
        body: `Total: ₹${order.totalAmount} from ${order.customerInfo?.name || 'Customer'}.`,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        vibrate: [200, 100, 200, 100, 200],
        tag: `order-${order.id}-${Date.now()}`, 
        renotify: true,
        data: {
          orderId: order.id,
          url: window.location.origin + '/orders',
          timestamp: Date.now()
        }
      };

      try {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          if (registration) {
            await registration.showNotification(title, options);
            return;
          }
        }
        
        const n = new Notification(title, options);
        n.onclick = () => {
          window.focus();
          window.location.href = '/orders';
          n.close();
        };
      } catch (e) {
        console.error("Notification error:", e);
      }
    }
  };

  useEffect(() => {
    if (!restaurantId || !notifEnabled) return;
    initRing();

    const q = query(
      collection(db, 'orders'),
      where('restaurantId', '==', restaurantId),
      orderBy('createdAt', 'desc')
    );

    const seenOrdersKey = `notified_orders_${restaurantId}`;
    const getSeenOrders = () => {
      try {
        const stored = localStorage.getItem(seenOrdersKey);
        return stored ? JSON.parse(stored) : [];
      } catch { return []; }
    };
    
    let seenOrders = getSeenOrders();

    const unsub = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) return;

      const newOrdersToNotify: any[] = [];

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const orderId = change.doc.id;
          if (!seenOrders.includes(orderId)) {
            newOrdersToNotify.push({ id: orderId, ...change.doc.data() });
            seenOrders.push(orderId);
          }
        }
      });

      const updatedSeen = seenOrders.slice(-50);
      localStorage.setItem(seenOrdersKey, JSON.stringify(updatedSeen));
      seenOrders = updatedSeen;

      if (newOrdersToNotify.length > 0) {
        newOrdersToNotify.forEach((order, index) => {
          setTimeout(() => notify(order), index * 1500);
        });
      }
    });

    return () => unsub();
  }, [restaurantId, notifEnabled]);

  return {
    user,
    restaurantId,
    restaurantName,
    setRestaurantName,
    restaurantProfile,
    setRestaurantProfile,
    menuItems,
    loading,
    notifEnabled,
    setNotifEnabled,
    initRing,
    newOrderIds,
    setNewOrderIds
  };
}
