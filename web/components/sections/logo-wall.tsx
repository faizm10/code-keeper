import { cn } from '@/lib/utils'
import Image from 'next/image'

type Organization = 
  | string 
  | {
      name: string
      logo: string
      alt?: string
      width?: number
      height?: number
    }

interface LogoWallProps {
  title?: string
  organizations: Organization[]
  className?: string
}

export function LogoWall({ 
  title = "GROWING TEAMS USE CODE KEEPER TO MAINTAIN THEIR CODE",
  organizations,
  className 
}: LogoWallProps) {
  return (
    <section className={cn("py-20 bg-gradient-to-b from-background via-muted/40 to-background", className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-base font-semibold text-foreground/80 uppercase tracking-wider">
            {title}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8 md:gap-x-16 md:gap-y-10">
          {organizations.map((org, index) => {
            if (typeof org === 'string') {
              return (
                <div
                  key={index}
                  className="text-xl md:text-2xl font-medium text-foreground/70 hover:text-foreground transition-colors duration-200"
                >
                  {org}
                </div>
              )
            }
            
            return (
              <div
                key={index}
                className="flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity duration-200"
              >
                <Image
                  src={org.logo}
                  alt={org.alt || org.name}
                  width={org.width || 120}
                  height={org.height || 60}
                  className="max-h-12 md:max-h-16 w-auto object-contain"
                />
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

