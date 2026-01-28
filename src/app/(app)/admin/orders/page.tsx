"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Search, ShoppingBag, CheckCircle, Clock, AlertCircle, Phone } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Order } from "@/types/order";
import { ApiResponse } from "@/types/apiResponse";
import { auth } from "@/firebase/client";
import OrderCard from "@/components/OrderCard";

// Modular Import


export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.get<ApiResponse<Order[]>>("/api/admin/orders", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
       
        setOrders(res.data.data || [])
      
      };
    } catch (error) {
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => { if (user) fetchOrders(); });
    return () => unsub();
  }, [fetchOrders]);

  const handleStatusUpdate = (id: string, up: Partial<Order>) => {
    setOrders(prev => prev.map(o => o.orderId === id ? { ...o, ...up } : o));
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const search = searchTerm.toLowerCase();
      const matchesSearch = o.orderId.toLowerCase().includes(search);
      
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "pending" && !o.user?.phoneVerified) ||
        (statusFilter === "placed" && o.status === "PLACED" && o.user?.phoneVerified) ||
        (statusFilter === "shipped" && o.status === "SHIPPED") ||
        (statusFilter === "delivered" && o.status === "DELIVERED");

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  const stats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter(o => !o.user?.phoneVerified).length,
    ready: orders.filter(o => o.user?.phoneVerified && o.status === "PLACED").length,
    done: orders.filter(o => o.status === "DELIVERED").length,
  }), [orders]);

  if (loading) return <div className="h-screen flex items-center justify-center"><Spinner /></div>;

  return (
    <div className="min-h-screen bg-white ">
      <div className="  p-6">
        <div className=" mx-auto">
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-zinc-400 text-sm">Watchera Order Management</p>
        </div>
      </div>

      <div className=" mx-auto px-4 -mt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard label="Total" val={stats.total} icon={<ShoppingBag />} />
          <StatCard label="Pending" val={stats.pending} icon={<Phone />} color="text-red-600" />
          <StatCard label="Ready" val={stats.ready} icon={<Clock />} color="text-amber-600" />
          <StatCard label="Done" val={stats.done} icon={<CheckCircle />} color="text-emerald-600" />
        </div>
      </div>

      <div className="sticky top-0 z-20 bg-white border-b p-4">
        <div className="max-w-3xl mx-auto space-y-3">
          <Input 
            placeholder="Search name or ID..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)}
            className="bg-zinc-50"
          />
          <div className="flex gap-2 overflow-x-auto pb-1">
            {["all", "pending", "placed", "shipped", "delivered"].map(f => (
              <button 
                key={f} 
                onClick={() => setStatusFilter(f)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium capitalize transition-all ${statusFilter === f ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-600'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-20 text-zinc-400"><AlertCircle className="mx-auto mb-2 opacity-20" /><p>No matching orders</p></div>
        ) : (
          filteredOrders.map(order => (
            <OrderCard key={order.orderId} order={order} onStatusUpdate={handleStatusUpdate} />
          ))
        )}
      </div>
    </div>
  );
}

const StatCard = ({ label, val, icon, color = "text-black" }: any) => (
  <Card className="border-zinc-200">
    <CardContent className="p-4 flex items-center justify-between">
      <div><div className={`text-2xl font-bold ${color}`}>{val}</div><div className="text-zinc-500 text-xs">{label}</div></div>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-zinc-50 ${color}`}>{icon}</div>
    </CardContent>
  </Card>
);