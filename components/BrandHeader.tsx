import Image from "next/image";
import Link from "next/link";

export default function BrandHeader() {
  return (
    <header className="brand-header flex items-center justify-between px-5 pb-1 pt-4 lg:px-8">
      <Link href="/" aria-label="Raios, voltar para explorar" className="flex items-center">
        <Image
          src="/brand/raios-crest.png"
          alt="Escudo Raios Futebol Club"
          width={48}
          height={48}
          priority
          className="crest-mark h-12 w-12 object-contain"
        />
      </Link>
    </header>
  );
}
