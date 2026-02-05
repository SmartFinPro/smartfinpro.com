import { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-button';
import {
  CheckCircle,
  Sparkles,
  BarChart3,
  FileText,
  Zap,
  Shield,
  ArrowRight,
  Clock,
  Target,
  Bot,
} from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Der 5-Minuten KI-Finanz-Workflow | SmartFinPro',
  description: 'Wie moderne Finanz-Profis 2+ Stunden täglich automatisieren. Kostenloser Guide mit Copy-Paste Prompts.',
  robots: 'noindex', // Don't index download page
};

export default function AIFinanceWorkflowPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Badge className="bg-white/20 text-white border-0 mb-4">
            Kostenloser Guide
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Der 5-Minuten KI-Finanz-Workflow
          </h1>
          <p className="text-xl opacity-90 mb-6">
            Mehr Analyse, weniger Tippen. Wie moderne Finanz-Profis 2+ Stunden täglich automatisieren.
          </p>
          <div className="flex items-center justify-center gap-6 text-sm opacity-80">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              5 Min. Lesezeit
            </span>
            <span className="flex items-center gap-1">
              <Target className="h-4 w-4" />
              3 Copy-Paste Prompts
            </span>
            <span className="flex items-center gap-1">
              <Shield className="h-4 w-4" />
              Compliance-Checkliste
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
        {/* Page 1: Golden Prompts */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="font-bold text-primary">1</span>
            </div>
            <h2 className="text-2xl font-bold">Die &ldquo;Golden Prompts&rdquo; (Copy &amp; Paste)</h2>
          </div>
          <p className="text-muted-foreground mb-6">
            Nutze diese Prompts in <strong>Claude 3.5 Sonnet</strong> oder <strong>Jasper</strong>, um sofort Ergebnisse zu sehen:
          </p>

          <div className="space-y-6">
            {/* Prompt 1 */}
            <PromptCard
              icon={<BarChart3 className="h-5 w-5" />}
              title="Der Markt-Analyst"
              prompt={`Analysiere die folgenden Quartalszahlen von [Unternehmen]. Erstelle eine Tabelle mit den 3 größten Chancen und den 3 kritischsten Risiken für einen Investor. Tonfall: Professionell, analytisch.

[Hier Quartalszahlen einfügen]`}
              result="Perfekt für: Earnings Calls, Due Diligence, Investment Memos"
            />

            {/* Prompt 2 */}
            <PromptCard
              icon={<FileText className="h-5 w-5" />}
              title="Der Reporting-Turbo"
              prompt={`Fasse diesen 50-seitigen Finanzbericht in 5 Bulletpoints für ein C-Level-Meeting zusammen. Fokus: Cashflow-Veränderungen und operative Marge.

[Hier Berichtstext einfügen]`}
              result="Perfekt für: Board Meetings, Investor Updates, Quick Summaries"
            />

            {/* Prompt 3 */}
            <PromptCard
              icon={<Sparkles className="h-5 w-5" />}
              title="Der Content-Generator"
              prompt={`Schreibe einen LinkedIn-Post über [Thema] für Finanzberater. Der Post soll:
- Mit einer provokanten Frage beginnen
- 3 konkrete Tipps enthalten
- Mit einem Call-to-Action enden
Tonfall: Professionell aber nahbar. Länge: 150-200 Wörter.`}
              result="Perfekt für: Social Media, Newsletter, Blog Posts"
            />
          </div>
        </section>

        {/* Page 2: Tool Matrix */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="font-bold text-primary">2</span>
            </div>
            <h2 className="text-2xl font-bold">Die Tool-Matrix für SmartFinPro</h2>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4 font-semibold">Aufgabe</th>
                      <th className="text-left p-4 font-semibold">Empfohlenes Tool</th>
                      <th className="text-left p-4 font-semibold">Warum?</th>
                      <th className="text-center p-4 font-semibold">Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                          <span className="font-medium">Content & SEO</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="secondary">Jasper AI</Badge>
                      </td>
                      <td className="p-4 text-muted-foreground text-sm">
                        Beste Vorlagen für Finanz-Marketing & Compliance.
                      </td>
                      <td className="p-4 text-center">
                        <Button asChild size="sm" variant="outline">
                          <Link href="/go/jasper-ai">
                            Testen
                            <ArrowRight className="h-3 w-3 ml-1" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-primary" />
                          <span className="font-medium">Datenanalyse</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="secondary">Claude.ai</Badge>
                      </td>
                      <td className="p-4 text-muted-foreground text-sm">
                        Größtes Kontextfenster für lange Geschäftsberichte.
                      </td>
                      <td className="p-4 text-center">
                        <Button asChild size="sm" variant="outline">
                          <Link href="/go/claude-ai">
                            Testen
                            <ArrowRight className="h-3 w-3 ml-1" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                    <tr>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-primary" />
                          <span className="font-medium">Automatisierung</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="secondary">Make.com</Badge>
                      </td>
                      <td className="p-4 text-muted-foreground text-sm">
                        Verbindet deine Bank-Daten mit deinem CRM.
                      </td>
                      <td className="p-4 text-center">
                        <Button asChild size="sm" variant="outline">
                          <Link href="/go/make">
                            Testen
                            <ArrowRight className="h-3 w-3 ml-1" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Page 3: Compliance Checklist */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="font-bold text-primary">3</span>
            </div>
            <h2 className="text-2xl font-bold">Die Compliance-Checkliste</h2>
          </div>
          <p className="text-muted-foreground mb-6">
            <strong>Dein Experten-Status:</strong> Bevor du auf &apos;Senden&apos; klickst, prüfe diese Punkte:
          </p>

          <Card className="border-2 border-primary/20">
            <CardContent className="p-6">
              <div className="space-y-4">
                <ChecklistItem
                  icon={<Shield className="h-5 w-5" />}
                  title="Datenschutz"
                  description="Wurden alle personenbezogenen Daten geschwärzt?"
                />
                <ChecklistItem
                  icon={<Target className="h-5 w-5" />}
                  title="Faktencheck"
                  description="Hat die KI Halluzinationen bei den Zahlen? (Immer gegenprüfen!)"
                />
                <ChecklistItem
                  icon={<Bot className="h-5 w-5" />}
                  title="Human-in-the-loop"
                  description="Klingt der Text nach einem Menschen oder einem Bot?"
                />
                <ChecklistItem
                  icon={<FileText className="h-5 w-5" />}
                  title="Disclaimer"
                  description="Ist der erforderliche Haftungsausschluss vorhanden?"
                />
                <ChecklistItem
                  icon={<CheckCircle className="h-5 w-5" />}
                  title="Audit Trail"
                  description="Ist dokumentiert, welche KI für welchen Output verwendet wurde?"
                />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* CTA Section */}
        <section className="text-center py-8">
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">
                Bereit, diese Workflows in Aktion zu sehen?
              </h3>
              <p className="text-muted-foreground mb-6">
                Jasper AI ist unser #1 Tool für Finanz-Content. Starte jetzt mit einer kostenlosen Testphase.
              </p>
              <Button asChild size="lg" className="gap-2">
                <Link href="/go/jasper-ai">
                  Jasper AI kostenlos testen
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <p className="text-xs text-muted-foreground mt-4">
                7 Tage kostenlos. Keine Kreditkarte erforderlich.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Footer */}
        <footer className="text-center text-sm text-muted-foreground border-t pt-8">
          <p className="mb-2">
            © {new Date().getFullYear()} SmartFinPro. Alle Rechte vorbehalten.
          </p>
          <p>
            Fragen? Schreib uns an{' '}
            <a href="mailto:hello@smartfinpro.com" className="text-primary hover:underline">
              hello@smartfinpro.com
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}

// Prompt Card Component
function PromptCard({
  icon,
  title,
  prompt,
  result,
}: {
  icon: React.ReactNode;
  title: string;
  prompt: string;
  result: string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/50 pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="relative">
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap font-mono">
            {prompt}
          </pre>
          <CopyButton text={prompt} />
        </div>
        <p className="text-sm text-muted-foreground mt-3 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-500" />
          {result}
        </p>
      </CardContent>
    </Card>
  );
}

// Checklist Item Component
function ChecklistItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
          <span className="font-medium">{title}</span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
    </div>
  );
}
