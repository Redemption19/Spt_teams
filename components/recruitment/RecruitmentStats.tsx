import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Briefcase, 
  FileText, 
  Search, 
  Star, 
  UserPlus, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  Users,
  Calendar,
  Target,
  Award
} from 'lucide-react';
import { RecruitmentStats } from '@/lib/recruitment-service';
import { useCurrency } from '@/hooks/use-currency';

interface RecruitmentStatsProps {
  stats: RecruitmentStats;
  loading?: boolean;
}

export default function RecruitmentStatsComponent({ stats, loading = false }: RecruitmentStatsProps) {
  const { formatAmount } = useCurrency();

  if (loading) {
    return (
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="card-enhanced">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
              <div className="h-3 sm:h-4 w-20 sm:w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 sm:h-4 w-3 sm:w-4 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="h-6 sm:h-8 w-12 sm:w-16 bg-gray-200 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Open Positions',
      value: stats.activeJobs,
      icon: Briefcase,
      color: 'text-blue-600',
      bgColor: 'bg-blue-500',
      description: 'Active job postings'
    },
    {
      title: 'Total Applications',
      value: stats.totalApplications,
      icon: FileText,
      color: 'text-green-600',
      bgColor: 'bg-green-500',
      description: 'All time applications'
    },
    {
      title: 'This Month',
      value: stats.applicationsThisMonth,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-500',
      description: 'Applications this month'
    },
    {
      title: 'In Review',
      value: stats.interviewsScheduled + stats.interviewsCompleted,
      icon: Search,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-500',
      description: 'Candidates in process'
    },
    {
      title: 'Interviews',
      value: stats.interviewsCompleted,
      icon: Users,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-500',
      description: 'Completed interviews'
    },
    {
      title: 'Offers Sent',
      value: stats.offersSent,
      icon: Star,
      color: 'text-orange-600',
      bgColor: 'bg-orange-500',
      description: 'Offers extended'
    },
    {
      title: 'Hired This Month',
      value: stats.hiresThisMonth,
      icon: UserPlus,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-500',
      description: 'New hires this month'
    },
    {
      title: 'Avg Time to Hire',
      value: `${stats.averageTimeToHire} days`,
      icon: Clock,
      color: 'text-rose-600',
      bgColor: 'bg-rose-500',
      description: 'Average hiring time'
    }
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Main Stats Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="card-enhanced hover:card-hover-enhanced transition-all duration-200 min-h-[100px] sm:min-h-[120px]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate pr-2">
                  {stat.title}
                </CardTitle>
                <div className={`p-1.5 sm:p-2 rounded-lg ${stat.bgColor}/10 flex-shrink-0`}>
                  <Icon className={`h-3 w-3 sm:h-4 sm:w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <div className={`text-lg sm:text-2xl font-bold ${stat.color} truncate`}>
                  {stat.value}
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Conversion Rates */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-3">
        <Card className="card-enhanced min-h-[100px] sm:min-h-[120px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium truncate pr-2">Application to Interview</CardTitle>
            <Target className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-lg sm:text-2xl font-bold text-blue-600">
              {stats.applicationToInterviewRate}%
            </div>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {stats.totalApplications} applications → {Math.round((stats.applicationToInterviewRate / 100) * stats.totalApplications)} interviews
            </p>
          </CardContent>
        </Card>

        <Card className="card-enhanced min-h-[100px] sm:min-h-[120px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium truncate pr-2">Interview to Offer</CardTitle>
            <Award className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-lg sm:text-2xl font-bold text-green-600">
              {stats.interviewToOfferRate}%
            </div>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {stats.interviewsCompleted} interviews → {stats.offersSent} offers
            </p>
          </CardContent>
        </Card>

        <Card className="card-enhanced min-h-[100px] sm:min-h-[120px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium truncate pr-2">Offer to Hire</CardTitle>
            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500 flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-lg sm:text-2xl font-bold text-purple-600">
              {stats.offerToHireRate}%
            </div>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {stats.offersSent} offers → {Math.round((stats.offerToHireRate / 100) * stats.offersSent)} hires
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}