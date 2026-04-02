import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/atoms";

export default function NotFound() {
  return (
    <main className="min-h-[80vh] flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md p-8 rounded-3xl border border-border/40 bg-background/50 backdrop-blur-md shadow-2xl flex flex-col items-center text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
        <div className="size-16 rounded-2xl bg-muted/30 flex items-center justify-center text-muted-foreground ring-1 ring-border/20">
          <Search aria-hidden="true" size={32} strokeWidth={1.5} />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Page not found</h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-[280px]">
            The page you are looking for does not exist or has been moved to a new location.
          </p>
        </div>

        <Button asChild size="lg" className="w-full">
          <Link href="/">
            Go to Dashboard
          </Link>
        </Button>
      </div>
    </main>
  );
}

