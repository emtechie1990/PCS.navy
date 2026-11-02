import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Installation from "@/pages/Installation";
import Search from "@/pages/Search";
import ListingDetail from "@/pages/ListingDetail";
import CreateListing from "@/pages/CreateListing";
import Resources from "@/pages/Resources";
import Safety from "@/pages/Safety";
import { ForgotPassword, Login, Register, ResetPassword } from "@/pages/Auth";
import MyListings from "@/pages/MyListings";
import Upgrade from "@/pages/Upgrade";
import NotFound from "@/pages/NotFound";

const Admin = lazy(() => import("@/pages/Admin"));

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/installation/:id" element={<Installation />} />
        <Route path="/search" element={<Search />} />
        <Route path="/listing/:id" element={<ListingDetail />} />
        <Route path="/create" element={<CreateListing />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/safety" element={<Safety />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/my-listings" element={<MyListings />} />
        <Route path="/upgrade/:id" element={<Upgrade />} />
        <Route path="/admin" element={<Suspense fallback={null}><Admin /></Suspense>} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
