import { Outlet } from "react-router-dom"
import Header from "./Header"
import Sidebar from "./Sidebar"

export default function Layout() {

    return (
        <div className="flex h-screen bg-gray-50 flex-1 flex-col">
            <Header />
            <main className="flex">
                <div>
                    <Sidebar />
                </div>
                <div className="w-full p-6 top-16 relative">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}
