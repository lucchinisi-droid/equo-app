import Image from "next/image";
import { Camera, Sparkles } from "lucide-react";

interface GalleryPhoto {
  src: string;
  alt: string;
  title: string;
  subtitle: string;
  span?: string;
}

const galleryPhotos: GalleryPhoto[] = [
  {
    src: "/images/19.png",
    alt: "Pascolo all'alba con cavalli e staccionata",
    title: "Benessere & Natura",
    subtitle: "La cura quotidiana inizia dal rispetto dei tempi e degli spazi del cavallo",
    span: "col-span-1 md:col-span-2 md:row-span-2",
  },
  {
    src: "/images/6.png",
    alt: "Primo piano maestoso cavallo frisone",
    title: "Salute & Dignità",
    subtitle: "Monitoraggio costante per mantenere ogni animale al massimo della forma",
  },
  {
    src: "/images/8.png",
    alt: "Cavallo sportivo in piena corsa al galoppo",
    title: "Prestazione & Sport",
    subtitle: "Scadenze veterinarie e passaporti FISE sempre pronti per la gara",
  },
  {
    src: "/images/7.png",
    alt: "Momento di intesa tra cavaliere e cavallo",
    title: "Fiducia & Relazione",
    subtitle: "Meno pensieri amministrativi, più tempo da dedicare al tuo compagno",
  },
  {
    src: "/images/16.png",
    alt: "Cavaliere e cavallo in riva al mare in bianco e nero",
    title: "Libertà & Passione",
    subtitle: "L'innovazione digitale al servizio della più antica tradizione equestre",
  },
  {
    src: "/images/12.png",
    alt: "Silhouette al tramonto con sfumature viola",
    title: "Equo Community",
    subtitle: "Centinaia di proprietari e scuderie già connessi",
  },
];

export function PhotoGallery() {
  return (
    <section className="py-20 bg-muted/30 border-t border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary uppercase tracking-wider">
            <Camera className="size-3.5" />
            Galleria Ufficiale Equo
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            L&apos;amore per i cavalli ispira ogni nostra riga di codice
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            Ogni funzionalità di Equo è nata sul campo: nei box, nei corridoi della scuderia, accanto al maniscalco e durante le visite veterinarie.
          </p>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[280px]">
          {galleryPhotos.map((photo, idx) => (
            <div
              key={idx}
              className={`group relative overflow-hidden rounded-3xl border border-border shadow-md transition-all duration-300 hover:shadow-xl ${
                photo.span || "col-span-1"
              }`}
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform transition-transform duration-300">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary-foreground/90 uppercase tracking-wider mb-1">
                  <Sparkles className="size-3 text-amber-400" />
                  {photo.title}
                </span>
                <p className="text-xs sm:text-sm text-white/90 leading-snug">
                  {photo.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
