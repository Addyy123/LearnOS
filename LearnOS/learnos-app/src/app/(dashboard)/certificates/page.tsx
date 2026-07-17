import { Award } from "lucide-react"
import { getEarnedCertificates } from "@/modules/learning/actions"
import CertificatesClient from "./CertificatesClient"

export default async function CertificatesPage() {
  const certificates = await getEarnedCertificates()

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
          <Award className="w-10 h-10 text-yellow-500" /> Certificates
        </h1>
        <p className="text-foreground/60 mt-2 text-lg">
          View and print your earned certificates of completion.
        </p>
      </div>

      <CertificatesClient certificates={certificates} />
    </div>
  )
}
