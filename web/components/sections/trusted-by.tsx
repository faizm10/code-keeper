import Image from 'next/image'

export default function TrustedBy() {
  return (
    <div className="py-14">
      <div className="max-w-screen-xl mx-auto px-4 md:px-8">
        <h3 className="font-semibold text-sm text-muted-foreground text-center">
          TRUSTED BY TEAMS
        </h3>
        <div className="mt-6">
          <ul className="flex gap-x-10 gap-y-6 flex-wrap items-center justify-center md:gap-x-16">
            <li>
              <a
                href="https://uoguelph.courses/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 opacity-70 hover:opacity-100 transition-opacity duration-200"
              >
                <Image
                  src="/Test3.png"
                  alt="uoguelph.courses logo"
                  width={120}
                  height={60}
                  className="max-h-12 md:max-h-16 w-auto object-contain"
                />
                <span className="text-lg font-medium text-foreground">uoguelph.courses</span>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

