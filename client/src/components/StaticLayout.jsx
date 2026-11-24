import { SiteHeader, SiteFooter } from './marketing/SiteChrome'

export default function StaticLayout({ children, title, subtitle }) {
  return (
    <div className="light-ui min-h-screen overflow-x-hidden">
      <SiteHeader />
      <div className="border-b border-slate-200 bg-gradient-to-b from-orange-50/70 to-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-3xl">
            {title && <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">{title}</h1>}
            {subtitle && <p className="mt-5 text-lg leading-8 text-slate-600">{subtitle}</p>}
          </div>
        </div>
      </div>
      <main className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        {children}
      </main>
      <SiteFooter />
    </div>
  )
}
