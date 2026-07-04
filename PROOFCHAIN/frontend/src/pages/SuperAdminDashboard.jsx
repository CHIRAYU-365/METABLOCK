import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Users, Shield, Clock, FileSpreadsheet } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Papa from 'papaparse';

const SuperAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [stats, setStats] = useState({ totalUsers: 0, totalAdmins: 0, pendingAdmins: 0 });
  const [chartData, setChartData] = useState([]);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
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
      const [statsRes, usersRes, auditRes, requestsRes] = await Promise.all([
        axios.get(`${API_URL}/api/superadmin/dashboard`, { headers }),
        axios.get(`${API_URL}/api/superadmin/users`, { headers }),
        axios.get(`${API_URL}/api/superadmin/audit`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/api/superadmin/requests`, { headers }).catch(() => ({ data: { requests: [] } }))
      ]);
      setStats(statsRes.data.stats);
      setChartData(statsRes.data.chartData || []);
      setUsers(usersRes.data.users);
      setAuditLogs(auditRes.data || []);
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

  const exportLoginRecords = () => {
    const loginLogs = auditLogs.filter(log => 
      log.action === 'USER_LOGIN' || 
      log.action === 'ADMIN_LOGIN'
    );
    if (loginLogs.length === 0) {
      return toast.error("No login logs found to export.");
    }

    const data = loginLogs.map(log => ({
      Timestamp: new Date(log.createdAt).toLocaleString(),
      User_ID: log.userId || 'N/A',
      Action: log.action,
      Details: log.details,
      IP_Address: log.ipAddress || 'Unknown'
    }));

    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ProofChain_Login_History_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Login history logs exported successfully!");
  };

  const exportAttendanceReport = () => {
    const scanLogs = auditLogs.filter(log => log.action === 'CHECK_IN' || log.action === 'CHECK_OUT');
    if (scanLogs.length === 0) {
      return toast.error("No Check-In/Check-Out records found to export.");
    }

    const userLogs = {};
    scanLogs.forEach(log => {
      if (!userLogs[log.userId]) {
        userLogs[log.userId] = [];
      }
      userLogs[log.userId].push(log);
    });

    const reportData = [];
    Object.keys(userLogs).forEach(uId => {
      const logs = userLogs[uId].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      
      for (let i = 0; i < logs.length; i++) {
        const log = logs[i];
        if (log.action === 'CHECK_IN') {
          const checkInTime = new Date(log.createdAt);
          let checkOutTime = null;
          let durationStr = 'Active / Not Checked-Out';

          const nextLog = logs[i + 1];
          if (nextLog && nextLog.action === 'CHECK_OUT') {
            checkOutTime = new Date(nextLog.createdAt);
            const diffMs = checkOutTime - checkInTime;
            const diffMin = Math.floor(diffMs / (1000 * 60));
            const hrs = Math.floor(diffMin / 60);
            const mins = diffMin % 60;
            durationStr = `${hrs} hrs ${mins} mins`;
            i++; // skip check-out log in next loops
          }

          reportData.push({
            'Employee ID/Details': log.userId || 'N/A',
            'Date': checkInTime.toLocaleDateString(),
            'Check-In': checkInTime.toLocaleTimeString(),
            'Check-Out': checkOutTime ? checkOutTime.toLocaleTimeString() : 'N/A',
            'Total Working Hours': durationStr,
            'IP Address': log.ipAddress || 'Unknown'
          });
        }
      }
    });

    if (reportData.length === 0) {
      return toast.error("No complete Shift Attendance records found to export.");
    }

    const csv = Papa.unparse(reportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ProofChain_Employee_Working_Hours_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Employee working hours report generated and downloaded!");
  };

  return (
    <div className="animate-fade-in">
      <div style={styles.header}>
        <h1>Super Admin Dashboard</h1>
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

      <div className="glass-panel" style={{ marginTop: '2rem', padding: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <button 
            className={activeTab === 'users' ? 'btn-primary' : 'btn-outline'} 
            onClick={() => setActiveTab('users')}
            style={{ padding: '8px 16px', borderRadius: '8px' }}
          >
            Platform Users
          </button>
          <button 
            className={activeTab === 'audit' ? 'btn-primary' : 'btn-outline'} 
            onClick={() => setActiveTab('audit')}
            style={{ padding: '8px 16px', borderRadius: '8px' }}
          >
            Audit Logs
          </button>
          <button 
            className={activeTab === 'requests' ? 'btn-primary' : 'btn-outline'} 
            onClick={() => setActiveTab('requests')}
            style={{ padding: '8px 16px', borderRadius: '8px' }}
          >
            Multi-Sig Requests
          </button>
        </div>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Loading data...</div>
        ) : activeTab === 'users' ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>User</th>
                  <th style={styles.th}>Role</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
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
                      {u.role === 'ADMIN' && u.status === 'PENDING' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => updateStatus(u.id, 'APPROVED')} className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                            Approve
                          </button>
                          <button onClick={() => updateStatus(u.id, 'REJECTED')} className="btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem', borderColor: 'var(--error)', color: 'var(--error)' }}>
                            Reject
                          </button>
                        </div>
                      )}
                      {(u.role === 'ADMIN' && u.status === 'APPROVED') && (
                         <button onClick={() => updateStatus(u.id, 'REVOKED')} className="btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem', borderColor: 'var(--error)', color: 'var(--error)' }}>
                           Revoke Access
                         </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'audit' ? (
          <div style={{ overflowX: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginBottom: '1rem' }}>
              <button 
                onClick={exportLoginRecords} 
                className="btn-outline" 
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '8px 16px', fontSize: '0.85rem' }}
              >
                <FileSpreadsheet size={16} /> Export Login Logs
              </button>
              <button 
                onClick={exportAttendanceReport} 
                className="btn-primary" 
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '8px 16px', fontSize: '0.85rem' }}
              >
                <FileSpreadsheet size={16} /> Export Working Hours Report (Excel)
              </button>
            </div>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Timestamp</th>
                  <th style={styles.th}>Action</th>
                  <th style={styles.th}>Details</th>
                  <th style={styles.th}>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map(log => (
                  <tr key={log.id} style={styles.tr}>
                    <td style={styles.td}>
                      <div style={{ fontSize: '0.85rem' }}>{new Date(log.createdAt).toLocaleString()}</div>
                    </td>
                    <td style={styles.td}>
                      <span style={{...styles.statusBadge, backgroundColor: 'rgba(99, 102, 241, 0.2)', color: 'var(--primary)'}}>
                        {log.action}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{log.details}</div>
                    </td>
                    <td style={styles.td}>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{log.ipAddress || 'Unknown'}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {auditLogs.length === 0 && (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No audit logs found.</div>
            )}
          </div>
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
  }
};
export default SuperAdminDashboard;
