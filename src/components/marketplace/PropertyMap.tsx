import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';

type Coordinates = [number, number];

export type MapProperty = {
  id: string;
  title: string;
  city: string;
  price: number;
  images: string[];
  latitude: number | null;
  longitude: number | null;
};

interface PropertyMapProps {
  center: Coordinates;
  zoom: number;
  properties: MapProperty[];
  notice: string | null;
  showMissingCoordinates: boolean;
  onOpenProperty?: (propertyId: string) => void;
}

function MapCenterUpdater({ center, zoom }: { center: Coordinates; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo(center, zoom, { duration: 0.8 });
  }, [center, map, zoom]);

  return null;
}

function priceMarkerIcon(price: number) {
  return L.divIcon({
    className: '',
    html: `<span class="gof-pmap-price">R$ ${Math.round(price)}</span>`,
    iconSize: [74, 34],
    iconAnchor: [37, 17],
  });
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export default function PropertyMap({
  center,
  zoom,
  properties,
  notice,
  showMissingCoordinates,
  onOpenProperty,
}: PropertyMapProps) {
  const mappableProperties = properties.filter((property) =>
    typeof property.latitude === 'number' && Number.isFinite(property.latitude) &&
    typeof property.longitude === 'number' && Number.isFinite(property.longitude),
  );

  return (
    <>
      <MapContainer
        center={center}
        zoom={zoom}
        minZoom={3}
        maxZoom={18}
        scrollWheelZoom
        style={{ height: '100%', width: '100%' }}
      >
        <MapCenterUpdater center={center} zoom={zoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {mappableProperties.map((property) => (
          <Marker
            key={property.id}
            position={[property.latitude as number, property.longitude as number]}
            icon={priceMarkerIcon(property.price)}
          >
            <Popup>
              <div className="w-52 overflow-hidden">
                <img
                  src={property.images[0] || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=500&q=80'}
                  alt={property.title}
                  className="mb-2 h-28 w-full rounded-md object-cover"
                />
                <p className="line-clamp-2 font-semibold text-slate-900">{property.title}</p>
                <p className="mt-1 text-sm font-bold text-teal-800">{formatCurrency(property.price)} / diária</p>
                <a
                  href={`/?imovel=${encodeURIComponent(property.id)}`}
                  onClick={(event) => {
                    if (onOpenProperty) {
                      event.preventDefault();
                      onOpenProperty(property.id);
                    }
                  }}
                  className="mt-2 inline-block text-xs font-semibold text-teal-800 underline"
                >
                  Ver detalhes do imóvel
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      {notice && (
        <p role="status" className="absolute left-3 right-3 top-3 z-[1000] rounded-lg bg-white/95 px-3 py-2 text-xs text-slate-700 shadow">
          {notice}
        </p>
      )}
      {showMissingCoordinates && (
        <p className="absolute bottom-3 left-3 right-3 z-[1000] rounded-lg bg-white/95 px-3 py-2 text-xs text-slate-600 shadow">
          Os imóveis sem coordenadas não aparecem no mapa.
        </p>
      )}
    </>
  );
}