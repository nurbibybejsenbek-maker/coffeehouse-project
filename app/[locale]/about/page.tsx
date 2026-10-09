import { getTranslations } from 'next-intl/server'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations('common')
  const tAbout = await getTranslations('about')

  return (
    <div className="container py-8 px-4 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 text-center">{t('about')}</h1>
      <div className="space-y-12">
        <section className="bg-card rounded-lg p-6 shadow-sm">
          <h2 className="text-3xl font-semibold mb-6">{tAbout('ourStory')}</h2>
          <div className="text-muted-foreground leading-relaxed space-y-4 whitespace-pre-line">
            {tAbout('storyText')}
          </div>
        </section>

        <section className="bg-card rounded-lg p-6 shadow-sm">
          <h2 className="text-3xl font-semibold mb-6">{tAbout('ourMission')}</h2>
          <div className="text-muted-foreground leading-relaxed space-y-4 whitespace-pre-line">
            {tAbout('missionText')}
          </div>
        </section>

        <section className="bg-card rounded-lg p-6 shadow-sm">
          <h2 className="text-3xl font-semibold mb-6">{tAbout('ourValues')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-3">{tAbout('quality')}</h3>
                <p className="text-sm text-muted-foreground">{tAbout('qualityText')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-3">{tAbout('sustainability')}</h3>
                <p className="text-sm text-muted-foreground">{tAbout('sustainabilityText')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-3">{tAbout('community')}</h3>
                <p className="text-sm text-muted-foreground">{tAbout('communityText')}</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="bg-card rounded-lg p-6 shadow-sm">
          <h2 className="text-3xl font-semibold mb-6">{tAbout('ourTeam')}</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            {tAbout('teamText')}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Айгүл', role: 'barista' },
              { name: 'Нұрлан', role: 'barista' },
              { name: 'Асхат', role: 'barista' },
            ].map((member, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="aspect-square bg-gradient-to-br from-amber-200 to-amber-400 rounded-lg mb-4 flex items-center justify-center">
                    <span className="text-4xl font-bold text-amber-800">
                      {member.name.charAt(0)}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold mb-1">{member.name}</h3>
                  <p className="text-sm text-muted-foreground">{tAbout(member.role)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

