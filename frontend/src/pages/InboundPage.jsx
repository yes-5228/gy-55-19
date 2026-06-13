import { PackagePlus, RefreshCw, Plus, Trash2, ListPlus } from "lucide-react";
import React, { useEffect, useState } from "react";

import { parcelsApi } from "../api/modules";
import DataTable from "../components/DataTable";
import MessageBox from "../components/MessageBox";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";

const initialForm = {
  tracking_no: "",
  sender_name: "",
  receiver_name: "",
  receiver_phone: "",
  carrier: "顺丰",
  size: "medium",
  note: "",
};

const createEmptyItem = () => ({ ...initialForm, _id: Date.now() + Math.random() });

export default function InboundPage() {
  const [mode, setMode] = useState("single"); // single | bulk
  const [form, setForm] = useState(initialForm);
  const [bulkItems, setBulkItems] = useState([createEmptyItem()]);
  const [parcels, setParcels] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [bulkResult, setBulkResult] = useState(null);

  const loadParcels = () => parcelsApi.list().then(setParcels);

  useEffect(() => {
    loadParcels();
  }, []);

  const updateField = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const updateBulkField = (id, field, value) => {
    setBulkItems(bulkItems.map((item) =>
      item._id === id ? { ...item, [field]: value } : item
    ));
  };

  const addBulkItem = () => {
    setBulkItems([...bulkItems, createEmptyItem()]);
  };

  const removeBulkItem = (id) => {
    if (bulkItems.length <= 1) return;
    setBulkItems(bulkItems.filter((item) => item._id !== id));
  };

  const submitSingle = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      const created = await parcelsApi.inbound(form);
      setMessage(`入库成功，柜格 ${created.locker_cell_detail.code}，取件码 ${created.pickup_code}。`);
      setForm(initialForm);
      loadParcels();
    } catch (err) {
      setError(err.message);
    }
  };

  const submitBulk = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setBulkResult(null);
    try {
      const items = bulkItems.map(({ _id, ...rest }) => rest);
      const result = await parcelsApi.bulkInbound({ items });
      setBulkResult(result);
      loadParcels();
      if (result.fail_count === 0) {
        setMessage(`全部入库成功，共 ${result.success_count} 票。`);
      } else {
        setError(`入库完成：成功 ${result.success_count} 票，失败 ${result.fail_count} 票。`);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <PageHeader title="快件入库" description="登记快件后自动分配空柜格，并生成取件码与通知记录。" />
      <section className="work-grid">
        <div className="panel form-panel">
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
            <button
              className={mode === "single" ? "primary" : "ghost"}
              onClick={() => setMode("single")}
              style={{ flex: 1 }}
            >
              <PackagePlus size={16} /> 单票入库
            </button>
            <button
              className={mode === "bulk" ? "primary" : "ghost"}
              onClick={() => setMode("bulk")}
              style={{ flex: 1 }}
            >
              <ListPlus size={16} /> 批量入库
            </button>
          </div>

          {mode === "single" && (
            <form onSubmit={submitSingle}>
              <h2>入库登记</h2>
              <label>运单号<input name="tracking_no" value={form.tracking_no} onChange={updateField} required /></label>
              <label>寄件方<input name="sender_name" value={form.sender_name} onChange={updateField} required /></label>
              <label>收件人<input name="receiver_name" value={form.receiver_name} onChange={updateField} required /></label>
              <label>手机号<input name="receiver_phone" value={form.receiver_phone} onChange={updateField} required /></label>
              <label>承运商<input name="carrier" value={form.carrier} onChange={updateField} required /></label>
              <label>
                柜格尺寸
                <select name="size" value={form.size} onChange={updateField}>
                  <option value="small">小</option>
                  <option value="medium">中</option>
                  <option value="large">大</option>
                </select>
              </label>
              <label>备注<input name="note" value={form.note} onChange={updateField} /></label>
              <button type="submit"><PackagePlus size={18} />确认入库</button>
              <MessageBox type="success">{message}</MessageBox>
              <MessageBox type="error">{error}</MessageBox>
            </form>
          )}

          {mode === "bulk" && (
            <form onSubmit={submitBulk}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h2 style={{ margin: 0 }}>批量入库</h2>
                <button type="button" className="ghost" onClick={addBulkItem}>
                  <Plus size={16} /> 添加一票
                </button>
              </div>
              <div style={{ maxHeight: "420px", overflowY: "auto", paddingRight: "4px" }}>
                {bulkItems.map((item, index) => (
                  <div
                    key={item._id}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      padding: "12px",
                      marginBottom: "12px",
                      position: "relative",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ fontWeight: 600, color: "#374151" }}>第 {index + 1} 票</span>
                      <button
                        type="button"
                        className="ghost"
                        onClick={() => removeBulkItem(item._id)}
                        style={{ padding: "4px 8px" }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      <label style={{ margin: 0 }}>
                        运单号
                        <input
                          name="tracking_no"
                          value={item.tracking_no}
                          onChange={(e) => updateBulkField(item._id, "tracking_no", e.target.value)}
                          required
                        />
                      </label>
                      <label style={{ margin: 0 }}>
                        承运商
                        <input
                          name="carrier"
                          value={item.carrier}
                          onChange={(e) => updateBulkField(item._id, "carrier", e.target.value)}
                          required
                        />
                      </label>
                      <label style={{ margin: 0 }}>
                        寄件方
                        <input
                          name="sender_name"
                          value={item.sender_name}
                          onChange={(e) => updateBulkField(item._id, "sender_name", e.target.value)}
                          required
                        />
                      </label>
                      <label style={{ margin: 0 }}>
                        收件人
                        <input
                          name="receiver_name"
                          value={item.receiver_name}
                          onChange={(e) => updateBulkField(item._id, "receiver_name", e.target.value)}
                          required
                        />
                      </label>
                      <label style={{ margin: 0 }}>
                        手机号
                        <input
                          name="receiver_phone"
                          value={item.receiver_phone}
                          onChange={(e) => updateBulkField(item._id, "receiver_phone", e.target.value)}
                          required
                        />
                      </label>
                      <label style={{ margin: 0 }}>
                        柜格尺寸
                        <select
                          name="size"
                          value={item.size}
                          onChange={(e) => updateBulkField(item._id, "size", e.target.value)}
                        >
                          <option value="small">小</option>
                          <option value="medium">中</option>
                          <option value="large">大</option>
                        </select>
                      </label>
                      <label style={{ gridColumn: "1 / -1", margin: 0 }}>
                        备注
                        <input
                          name="note"
                          value={item.note}
                          onChange={(e) => updateBulkField(item._id, "note", e.target.value)}
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
              <button type="submit" style={{ marginTop: "12px" }}>
                <PackagePlus size={18} /> 批量入库 ({bulkItems.length} 票)
              </button>
              <MessageBox type="success">{message}</MessageBox>
              <MessageBox type="error">{error}</MessageBox>
            </form>
          )}

          {bulkResult && (
            <div style={{ marginTop: "16px" }}>
              <h3 style={{ marginBottom: "8px" }}>入库结果</h3>
              <div style={{ maxHeight: "280px", overflowY: "auto" }}>
                {bulkResult.results.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "6px",
                      marginBottom: "6px",
                      backgroundColor: item.success ? "#ecfdf5" : "#fef2f2",
                      border: `1px solid ${item.success ? "#a7f3d0" : "#fecaca"}`,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 500 }}>
                        {item.success ? "✅" : "❌"} {item.tracking_no}
                      </span>
                    </div>
                    <div style={{ fontSize: "13px", color: item.success ? "#065f46" : "#991b1b", marginTop: "4px" }}>
                      {item.message}
                    </div>
                    {item.parcel && (
                      <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
                        柜格: {item.parcel.locker_cell_detail?.code} | 取件码: {item.parcel.pickup_code}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <section className="panel">
          <div className="panel-title">
            <h2>快件列表</h2>
            <button className="ghost" onClick={loadParcels}><RefreshCw size={16} />刷新</button>
          </div>
          <DataTable
            rows={parcels}
            columns={[
              { key: "tracking_no", title: "运单号" },
              { key: "receiver_name", title: "收件人" },
              { key: "cell", title: "柜格", render: (row) => row.locker_cell_detail?.code },
              { key: "pickup_code", title: "取件码" },
              { key: "status", title: "状态", render: (row) => <StatusBadge status={row.status} label={row.status_label} /> },
            ]}
          />
        </section>
      </section>
    </>
  );
}
