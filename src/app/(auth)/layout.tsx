import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <main className="grid min-h-screen place-items-center bg-stone-50 px-5 py-12"><div className="w-full max-w-md"><Link href="/" className="mb-8 block text-center text-xl font-bold">StudyHub</Link>{children}</div></main>;
}
