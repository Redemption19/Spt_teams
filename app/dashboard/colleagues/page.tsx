import ViewColleagues from '@/components/colleagues/view-colleagues';

export default function ColleaguesPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Your Team</h1>
        <p className="text-muted-foreground">Connect with your teammates</p>
      </div>
      <ViewColleagues />
    </div>
  );
} 