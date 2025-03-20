import Header from '@/components/getting-started/header'
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card } from '@/components/ui/card';

export default async function Index() {
  // Monitor stats
  const stats = {
    total: 4,
    active: 4,
    limits: { monitor_limit: 50, monitors_available: 46 },
    by_type: {
      api: { up: 0, down: 0, name: 'API Performance', count: 0 },
      dns: { up: 0, down: 0, name: 'DNS', count: 0 },
      ssl: { up: 0, down: 0, name: 'SSL Certificate', count: 0 },
      http: { up: 0, down: 0, name: 'HTTP/Website', count: 4 },
      ping: { up: 0, down: 0, name: 'Ping', count: 0 },
      port: { up: 0, down: 0, name: 'Port', count: 0 },
      smtp: { up: 0, down: 0, name: 'Email/SMTP', count: 0 },
      keyword: { up: 0, down: 0, name: 'Keyword Rank', count: 0 },
      database: { up: 0, down: 0, name: 'Database', count: 0 },
      heartbeat: { up: 0, down: 0, name: 'Heartbeat', count: 0 }
    },
    status_counts: { up: 0, down: 0, error: 0, pending: 4, warning: 0, degraded: 0 },
    in_maintenance: 0
  };

  return (
    <div className="flex-1 w-full flex flex-col gap-20 items-center">
      <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16 px-2 md:px-0">
        <div className="w-full max-w-screen-lg flex justify-between items-center p-3 text-sm">
            <Button asChild className="fill-black gap-x-1" variant="outline" size="sm">
              <a target="_blank" rel="noopener" href="https://twitter.com/tiniscule">
                <svg xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 50 50" width="25px" height="25px"><path d="M 5.9199219 6 L 20.582031 27.375 L 6.2304688 44 L 9.4101562 44 L 21.986328 29.421875 L 31.986328 44 L 44 44 L 28.681641 21.669922 L 42.199219 6 L 39.029297 6 L 27.275391 19.617188 L 17.933594 6 L 5.9199219 6 z M 9.7167969 8 L 16.880859 8 L 40.203125 42 L 33.039062 42 L 9.7167969 8 z"/></svg>
                Created by @tiniscule
              </a>
            </Button>

            <Link href="/dashboard">Dashboard</Link>
        </div>
      </nav>

      <div className="flex-1 flex flex-col gap-12 max-w-4xl px-3 w-full">
        <Header />
        <main className="flex-1 flex flex-col gap-6">
          <section className="mb-8">
            <h2 className="font-bold text-4xl mb-4">Monitor Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="p-4">
                <h3 className="text-lg font-medium mb-2">Monitors</h3>
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active</p>
                    <p className="text-2xl font-bold">{stats.active}</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4">
                <h3 className="text-lg font-medium mb-2">Limits</h3>
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">{stats.limits.monitor_limit}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Available</p>
                    <p className="text-2xl font-bold">{stats.limits.monitors_available}</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4">
                <h3 className="text-lg font-medium mb-2">Status</h3>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="text-2xl font-bold">{stats.status_counts.pending}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Up</p>
                    <p className="text-2xl font-bold">{stats.status_counts.up}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Down</p>
                    <p className="text-2xl font-bold">{stats.status_counts.down}</p>
                  </div>
                </div>
              </Card>
            </div>
            
            <h3 className="font-bold text-2xl mb-3">Monitors by Type</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {Object.entries(stats.by_type)
                .filter(([_, typeData]) => (typeData as any).count > 0)
                .map(([type, typeData]) => (
                  <Card key={type} className="p-3">
                    <h4 className="text-sm font-medium">{(typeData as any).name}</h4>
                    <p className="text-xl font-bold">{(typeData as any).count}</p>
                  </Card>
                ))}
            </div>
          </section>
          <h2 className="font-bold text-4xl mb-4">Next steps</h2>
          <ol className="list-decimal space-y-4">
            <li className="leading-relaxed">
              Decide if you want to support both personal and team accounts. Personal accounts can't be disabled, but you can remove the dashboard sections that display them. 
              <a className="border-b mx-2" href="https://usebasejump.com/docs/understanding-accounts">Learn more here</a></li>
            <li className="leading-relaxed">
              <p>Generate additional tables in Supabase using the Basejump CLI</p>
              <pre className="bg-red-50 px-2 py-1 rounded overflow-hidden text-sm inline">npx @usebasejump/cli@latest generate table posts title body published:boolean published_at:date </pre>
              <p>The CLI isn't required, but it'll help you learn the RLS policy options available to you. <a className="border-b mx-2" href="https://usebasejump.com/docs/example-schema">Learn more here</a></p>
            </li>
            <li>
              Flesh out the dashboard with any additional functionality you need. <a className="border-b mx-2" href="https://usebasejump.com/docs">Check out the Basejump API docs here</a>
            </li>
            <li>
              Setup subscription billing. Determine if you want to bill for both personal and team accounts, update your <pre className="bg-red-50 px-2 py-1 rounded overflow-hidden text-sm inline">basejump.config</pre> table accordingly. <a className="border-b mx-2" href="https://usebasejump.com/docs/billing-stripe">Learn more about setting up Stripe here</a>
            </li>
          </ol>
          <h2 className="font-bold text-4xl mb-4 mt-8">Resources</h2>
          <ul className="list-disc space-y-2">
            <li className="leading-relaxed">
              <a className="border-b mx-2" href="https://usebasejump.com/docs">Basejump Docs</a>
            </li>
            <li className="leading-relaxed">
              <a className="border-b mx-2" href="https://usebasejump.com/docs/testing">Writing tests on Supabase with pgTAP</a>
            </li>
            <li className="leading-relaxed">
              <a className="border-b mx-2" href="https://usebasejump.com/docs/rls">Working with RLS Policies in Supabase</a>
            </li>
            <li className="leading-relaxed">
              <a className="border-b mx-2" href="https://usebasejump.com/docs/deployment">Deploying to Production</a>
            </li>
          </ul>
          <div className="text-center flex gap-x-4 items-center mx-auto mt-8">
            Questions? 
            <Button asChild className="fill-white gap-x-1"><a target="_blank" rel="noopener" href="https://twitter.com/tiniscule">Ask or follow along on <svg xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 50 50" width="25px" height="25px"><path d="M 5.9199219 6 L 20.582031 27.375 L 6.2304688 44 L 9.4101562 44 L 21.986328 29.421875 L 31.986328 44 L 44 44 L 28.681641 21.669922 L 42.199219 6 L 39.029297 6 L 27.275391 19.617188 L 17.933594 6 L 5.9199219 6 z M 9.7167969 8 L 16.880859 8 L 40.203125 42 L 33.039062 42 L 9.7167969 8 z"/></svg></a></Button>
          </div>
        </main>
      </div>

      <footer className="w-full border-t border-t-foreground/10 p-8 flex justify-center gap-x-2 items-center text-sm">
          <p className="text-3xl">👦🐯</p>
        <p>
            There&apos;s treasure everywhere
        </p>
      </footer>
    </div>
  )
}
