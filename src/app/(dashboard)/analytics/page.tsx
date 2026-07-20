import { getLearnerAnalytics } from "@/modules/learning/analyticsActions"
import AnalyticsView from "./AnalyticsView"

export default async function AnalyticsPage() {
  const data = await getLearnerAnalytics()

  return (
    <div className="w-full pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Learning Analytics</h1>
        <p className="text-foreground/60">Track your progress, mastery, and activity over time.</p>
      </div>

      <AnalyticsView initialData={data} />
    </div>
  )
}
