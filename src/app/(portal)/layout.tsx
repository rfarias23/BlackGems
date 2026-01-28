export default function PortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-background font-sans antialiased text-foreground flex flex-col">
            {/* Simple Header */}
            <header className="border-b border-border bg-card">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="font-serif text-2xl font-bold text-primary">
                        BlackGem <span className="text-muted-foreground font-sans text-sm font-normal ml-2">Investor Portal</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-sm text-muted-foreground">
                            Welcome, Investor
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 container mx-auto px-4 py-8">
                {children}
            </main>

            {/* Footer */}
            <footer className="border-t border-border py-6 bg-muted/30">
                <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
                    © {new Date().getFullYear()} NIRO Group LLC. All rights reserved.
                </div>
            </footer>
        </div>
    );
}
