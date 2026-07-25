import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Users, Shield, Clock, FileSpreadsheet } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Papa from 'papaparse';
import { QRCodeSVG } from 'qrcode.react';

import { useLocation } from 'react-router-dom';

const SuperAdminDashboard = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const tabFromUrl = queryParams.get('tab') || 'overview';

  const [activeTab, setActiveTab] = useState(tabFromUrl);

  useEffect(() => {
    setActiveTab(tabFromUrl);
  }, [tabFromUrl]);
  const [stats, setStats] = useState({ totalUsers: 0, totalAdmins: 0, pendingAdmins: 0 });
  const [chartData, setChartData] = useState([]);
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token, user } = useAuth();
  useEffect(() => {
    fetchData();
  }, []);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [statsRes, usersRes, requestsRes] = await Promise.all([
        axios.get(`${API_URL}/api/superadmin/dashboard`, { headers }),
        axios.get(`${API_URL}/api/superadmin/users`, { headers }),
        axios.get(`${API_URL}/api/superadmin/requests`, { headers }).catch(() => ({ data: { requests: [] } }))
      ]);
      setStats(statsRes.data.stats);
      setChartData(statsRes.data.chartData || []);
      setUsers(usersRes.data.users);
      setRequests(requestsRes.data.requests || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };
  const updateStatus = async (userId, newStatus) => {
    try {
      await axios.put(`${API_URL}/api/superadmin/users/${userId}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`User status updated to ${newStatus}`);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    }
  };
  const updateRole = async (userId, newRole) => {
    if (!window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;
    try {
      await axios.put(`${API_URL}/api/superadmin/users/${userId}/role`, { role: newRole }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`User role updated to ${newRole}`);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update role");
    }
  };

  const updateRequestStatus = async (requestId, newStatus) => {
    try {
      await axios.put(`${API_URL}/api/superadmin/requests/${requestId}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Request status updated to ${newStatus}`);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update request");
    }
  };
  const handleSaveDesignation = async (userId, value) => {
    try {
      await axios.put(`${API_URL}/api/superadmin/users/${userId}/designation`, { designation: value }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Designation updated!");
      setUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, designation: value } : u));
    } catch (err) {
      console.error(err);
      toast.error("Failed to update designation");
    }
  };

  const downloadIDCard = (name, designation, email, userId) => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 0, 600);
    grad.addColorStop(0, '#0a0a0c');
    grad.addColorStop(0.5, '#121216');
    grad.addColorStop(1, '#1e1233');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 400, 600);

    ctx.fillStyle = 'rgba(99, 102, 241, 0.1)';
    ctx.beginPath();
    ctx.arc(0, 0, 200, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(168, 85, 247, 0.1)';
    ctx.beginPath();
    ctx.arc(400, 600, 250, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ProofChain', 200, 60);

    ctx.fillStyle = '#00F0FF';
    ctx.font = 'bold 11px Space Grotesk, sans-serif';
    ctx.fillText('BLOCKCHAIN VERIFIED', 200, 80);

    ctx.fillStyle = '#71717A';
    ctx.font = '10px Space Grotesk, sans-serif';
    ctx.fillText('Document Verification Platform', 200, 95);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.beginPath();
    ctx.moveTo(40, 110);
    ctx.lineTo(360, 110);
    ctx.stroke();

    ctx.fillStyle = '#00F0FF';
    ctx.font = 'bold 18px Outfit, sans-serif';
    ctx.fillText(name.toUpperCase(), 200, 160);

    ctx.fillStyle = '#F0F0F5';
    ctx.font = 'italic 14px Space Grotesk, sans-serif';
    ctx.fillText(designation, 200, 190);

    ctx.fillStyle = '#71717A';
    ctx.font = '12px Space Grotesk, sans-serif';
    ctx.fillText(email, 200, 215);

    const svgElement = document.querySelector(`svg[data-qr="${userId}"]`);
    let svgBlob;
    if (svgElement) {
      const svgString = new XMLSerializer().serializeToString(svgElement);
      svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    } else {
      const tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const tempString = new XMLSerializer().serializeToString(tempSvg);
      svgBlob = new Blob([tempString], { type: 'image/svg+xml;charset=utf-8' });
    }
    
    const url = URL.createObjectURL(svgBlob);
    const qrImg = new Image();
    qrImg.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(130, 250, 140, 140, 12);
      ctx.fill();

      ctx.drawImage(qrImg, 140, 260, 120, 120);
      URL.revokeObjectURL(url);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath();
      ctx.moveTo(40, 450);
      ctx.lineTo(360, 450);
      ctx.stroke();

      ctx.fillStyle = '#71717A';
      ctx.font = '9px Space Grotesk, sans-serif';
      ctx.fillText('Blockchain Document Verification', 200, 480);
      ctx.fillText('Powered by Solana & IPFS', 200, 500);

      ctx.fillStyle = '#00F0FF';
      ctx.font = 'bold 10px Space Grotesk, sans-serif';
      ctx.fillText('EMPLOYEE ATTENDANCE CARD', 200, 540);

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${name.replace(/\s+/g, '_')}_ProofChain_ID.png`;
      link.click();
    };
    qrImg.src = url;
  };

  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  const viewAttendanceModal = () => {
    const scanLogs = [];
    if (scanLogs.length === 0) {
      return toast.error("No Check-In/Check-Out records found.");
    }

    const userLogs = {};
    scanLogs.forEach(log => {
      if (!userLogs[log.userId]) {
        userLogs[log.userId] = [];
      }
      userLogs[log.userId].push(log);
    });

    const records = [];
    Object.keys(userLogs).forEach(uId => {
      const logs = userLogs[uId].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      
      for (let i = 0; i < logs.length; i++) {
        const log = logs[i];
        if (log.action === 'CHECK_IN') {
          const checkInTime = new Date(log.createdAt);
          let checkOutTime = null;

          const nextLog = logs[i + 1];
          if (nextLog && nextLog.action === 'CHECK_OUT') {
            checkOutTime = new Date(nextLog.createdAt);
            i++;
          }

          const matchingUser = users.find(u => u.id === log.userId);

          records.push({
            id: log.id,
            name: matchingUser ? matchingUser.username : 'Unknown User',
            role: matchingUser ? matchingUser.role : 'USER',
            loginTime: checkInTime.toLocaleString(),
            logoutTime: checkOutTime ? checkOutTime.toLocaleString() : 'Active / Checked-In'
          });
        }
      }
    });

    setAttendanceRecords(records);
    setShowAttendanceModal(true);
  };

  return (
    <div className="page-container animate-fade-in">
      {activeTab === 'overview' && (
        <>
          <div style={styles.header}>
            <h1 style={{ marginBottom: '0.5rem' }}>
              <span className="gradient-text">Super Admin</span> Dashboard
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>Welcome back, {user?.username}. Manage the platform's roles and privileges here.</p>
          </div>
      <div style={styles.statsGrid}>
        <div className="glass-panel" style={styles.statCard}>
          <div style={styles.statIcon}><Users size={24} /></div>
          <div>
            <h4 style={{ color: 'var(--text-secondary)', margin: 0 }}>Total Users</h4>
            <h2 style={{ margin: '0.5rem 0 0 0' }}>{stats.totalUsers}</h2>
          </div>
        </div>
        <div className="glass-panel" style={styles.statCard}>
          <div style={{...styles.statIcon, backgroundColor: 'rgba(34, 197, 94, 0.2)', color: 'var(--success)'}}><Shield size={24} /></div>
          <div>
            <h4 style={{ color: 'var(--text-secondary)', margin: 0 }}>Active Admins</h4>
            <h2 style={{ margin: '0.5rem 0 0 0' }}>{stats.totalAdmins}</h2>
          </div>
        </div>
        <div className="glass-panel" style={styles.statCard}>
          <div style={{...styles.statIcon, backgroundColor: 'rgba(245, 158, 11, 0.2)', color: 'var(--warning)'}}><Clock size={24} /></div>
          <div>
            <h4 style={{ color: 'var(--text-secondary)', margin: 0 }}>Pending Admins</h4>
            <h2 style={{ margin: '0.5rem 0 0 0' }}>{stats.pendingAdmins}</h2>
          </div>
        </div>
      </div>
      
      {chartData.length > 0 && (
        <div className="glass-panel" style={{ marginTop: '2rem', padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>User Growth Over Time</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="name" stroke="var(--text-secondary)" />
                <YAxis stroke="var(--text-secondary)" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#121216', border: '1px solid var(--border-color)', borderRadius: '8px' }} 
                  itemStyle={{ color: 'var(--accent-primary)' }} 
                />
                <Line type="monotone" dataKey="users" stroke="var(--accent-primary)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

        </>
      )}

      {activeTab === 'users' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={styles.header}>
            <h1 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Platform Users</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Manage access, roles, and view ID cards for all personnel.</p>
          </div>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>Loading data...</div>
          ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>User</th>
                  <th style={styles.th}>Role</th>
                  <th style={styles.th}>Designation</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Attendance QR Code</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={styles.tr}>
                    <td style={styles.td}>
                      <div style={{ fontWeight: '500' }}>{u.username}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{u.email}</div>
                    </td>
                    <td style={styles.td}>
                      <select 
                        value={u.role} 
                        onChange={(e) => updateRole(u.id, e.target.value)}
                        style={styles.select}
                        disabled={u.id === user.id} 
                      >
                        <option value="USER">User</option>
                        <option value="ADMIN">Admin</option>
                        <option value="SUPER_ADMIN">Super Admin</option>
                      </select>
                    </td>
                    <td style={styles.td}>
                      {u.role === 'SUPER_ADMIN' ? (
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>N/A</span>
                      ) : (
                        <input 
                          type="text" 
                          defaultValue={u.designation || 'Developer'} 
                          onBlur={(e) => handleSaveDesignation(u.id, e.target.value)}
                          style={styles.miniInput}
                          placeholder="Designation"
                        />
                      )}
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.statusBadge,
                        backgroundColor: u.status === 'ACTIVE' || u.status === 'APPROVED' ? 'rgba(34, 197, 94, 0.2)' : 
                                         u.status === 'PENDING' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: u.status === 'ACTIVE' || u.status === 'APPROVED' ? 'var(--success)' : 
                               u.status === 'PENDING' ? 'var(--warning)' : 'var(--error)'
                      }}>
                        {u.status}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {u.role === 'SUPER_ADMIN' ? (
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>N/A (Super Admin)</span>
                      ) : u.status === 'PENDING' ? (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => updateStatus(u.id, 'APPROVED')} className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                            Approve
                          </button>
                          <button onClick={() => updateStatus(u.id, 'REJECTED')} className="btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem', borderColor: 'var(--error)', color: 'var(--error)' }}>
                            Reject
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ background: '#fff', padding: '0.35rem', borderRadius: '6px', display: 'inline-block' }}>
                            <QRCodeSVG value={u.id} size={55} data-qr={u.id} />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              ID: {u.id.substring(0, 8)}...
                            </span>
                            <button 
                              onClick={() => downloadIDCard(u.username, u.designation || 'Developer', u.email, u.id)}
                              className="btn-primary"
                              style={{ padding: '4px 8px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              Download ID
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={styles.header}>
            <h1 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Multi-Sig Requests</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Review and approve documents that require multiple administrator signatures.</p>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>Loading data...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Document</th>
                    <th style={styles.th}>Issuer (Admin)</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(req => (
                    <tr key={req.id} style={styles.tr}>
                      <td style={styles.td}>
                        <div style={{ fontWeight: '500' }}>{req.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Owner: {req.ownerEmail}</div>
                      </td>
                      <td style={styles.td}>
                        <div style={{ fontSize: '0.9rem' }}>{req.issuerEmail}</div>
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.statusBadge,
                          backgroundColor: req.status === 'APPROVED' ? 'rgba(34, 197, 94, 0.2)' : 
                                           req.status === 'PENDING' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                          color: req.status === 'APPROVED' ? 'var(--success)' : 
                                 req.status === 'PENDING' ? 'var(--warning)' : 'var(--error)'
                        }}>
                          {req.status}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {req.status === 'PENDING' && (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => updateRequestStatus(req.id, 'APPROVED')} className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                              Approve
                            </button>
                            <button onClick={() => updateRequestStatus(req.id, 'REJECTED')} className="btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem', borderColor: 'var(--error)', color: 'var(--error)' }}>
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {requests.length === 0 && (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No multi-sig requests found.</div>
              )}
            </div>
          )}
        </div>
      )}

      {showAttendanceModal && (
        <div style={styles.modalOverlay}>
          <div className="glass-panel" style={styles.modalContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, color: 'var(--accent-secondary)' }}>Shift Attendance Records</h3>
              <button 
                onClick={() => setShowAttendanceModal(false)} 
                className="btn-outline" 
                style={{ padding: '6px 12px', fontSize: '0.85rem' }}
              >
                Close
              </button>
            </div>
            <div style={{ overflowX: 'auto', maxHeight: '55vh' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Role</th>
                    <th style={styles.th}>Log In Time</th>
                    <th style={styles.th}>Log Out Time</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ ...styles.td, textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No attendance logs registered yet.
                      </td>
                    </tr>
                  ) : (
                    attendanceRecords.map(rec => (
                      <tr key={rec.id} style={styles.tr}>
                        <td style={styles.td}><strong>{rec.name}</strong></td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.statusBadge,
                            backgroundColor: rec.role === 'SUPER_ADMIN' ? 'rgba(168, 85, 247, 0.2)' : 
                                             rec.role === 'ADMIN' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                            color: rec.role === 'SUPER_ADMIN' ? 'var(--accent-secondary)' : 
                                   rec.role === 'ADMIN' ? 'var(--primary)' : 'var(--text-secondary)'
                          }}>
                            {rec.role}
                          </span>
                        </td>
                        <td style={{ ...styles.td, fontSize: '0.85rem' }}>{rec.loginTime}</td>
                        <td style={{ ...styles.td, fontSize: '0.85rem', color: rec.logoutTime.includes('Active') ? 'var(--warning)' : 'inherit' }}>
                          {rec.logoutTime}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
const styles = {
  header: {
    marginBottom: '2rem'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
  },
  statCard: {
    padding: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem'
  },
  statIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    color: 'var(--primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '1rem',
    color: 'var(--text-secondary)',
    borderBottom: '1px solid var(--border-color)',
    fontWeight: '500'
  },
  td: {
    padding: '1rem',
    borderBottom: '1px solid rgba(255,255,255,0.05)'
  },
  tr: {
    transition: 'background-color 0.2s',
  },
  select: {
    padding: '0.5rem',
    borderRadius: '6px',
    border: '1px solid var(--border-color)',
    backgroundColor: 'rgba(0,0,0,0.3)',
    color: 'white',
    outline: 'none',
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    letterSpacing: '0.5px'
  },
  miniInput: {
    padding: '6px 10px',
    borderRadius: '6px',
    border: '1px solid var(--border-color)',
    backgroundColor: 'rgba(0,0,0,0.2)',
    color: 'white',
    width: '140px',
    fontSize: '0.85rem',
    outline: 'none'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5, 5, 10, 0.85)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  modalContent: {
    width: '90%',
    maxWidth: '850px',
    maxHeight: '80vh',
    padding: '2.5rem',
    overflowY: 'auto',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
  }
};
export default SuperAdminDashboard;
