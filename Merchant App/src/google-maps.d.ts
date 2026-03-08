// Type declarations for Google Maps JavaScript API (Places, Geocoder)
declare namespace google.maps {
    class Geocoder {
        geocode(
            request: { location?: { lat: number; lng: number }; address?: string },
        ): Promise<{ results: GeocoderResult[] }>;
    }

    interface GeocoderResult {
        formatted_address: string;
        geometry: {
            location: LatLng;
        };
    }

    class LatLng {
        lat(): number;
        lng(): number;
    }

    namespace places {
        class Autocomplete {
            constructor(input: HTMLInputElement, options?: AutocompleteOptions);
            addListener(event: string, handler: () => void): void;
            getPlace(): PlaceResult;
        }

        interface AutocompleteOptions {
            types?: string[];
            componentRestrictions?: { country: string | string[] };
            fields?: string[];
        }

        interface PlaceResult {
            formatted_address?: string;
            name?: string;
            geometry?: {
                location: LatLng;
            };
        }
    }
}

interface Window {
    google?: typeof google;
}
