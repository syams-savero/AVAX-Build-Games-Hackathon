// app/messages/layout.tsx
// Override root layout — no footer, full height
export default function MessagesLayout({ children }: { children: React.ReactNode }) {
    return <div className="h-[calc(100vh-65px)] overflow-hidden">{children}</div>;
}