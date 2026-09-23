import Image from "next/image";
import Link from "next/link";

export default function BrandHeader() {
  return (
    <header className="brand-header flex items-center justify-between px-5 pb-1 pt-4 lg:px-8">
      <Link href="/" aria-label="Raios, voltar para explorar" className="flex items-center">
        <Image
          src="/brand/raios-crest.png"
          alt="Escudo Raios Futebol Club"
          width={44}
          height={44}
          priority
          className="crest-mark h-10 w-10 object-contain sm:h-11 sm:w-11"
        />
      </Link>
      <span className="font-display text-sm font-bold tracking-[0.08em] text-cream/80">RAIOS</span>
    </header>
  );
}
