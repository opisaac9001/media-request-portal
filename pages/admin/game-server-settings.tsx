import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import AnimatedBackground from '../../components/AnimatedBackground';
import AdminHeader from '../../components/AdminHeader';
import { components, colors, spacing, borderRadius } from '../../styles/adminTheme';


const serverList = [
  {
    key: 'palworld',
    name: 'Palworld',
    fields: null // Will be generated dynamically
  },
  {
    key: 'minecraft-java',
    name: 'Minecraft Java',
    fields: [
      { label: 'Server Name', name: 'server-name', type: 'text' },
      { label: 'Max Players', name: 'max-players', type: 'number' },
      { label: 'Online Mode', name: 'online-mode', type: 'checkbox' }
    ]
  },
  {
    key: 'minecraft-bedrock',
    name: 'Minecraft Bedrock',
    fields: [
      { label: 'Server Name', name: 'server-name', type: 'text' },
      { label: 'Max Players', name: 'max-players', type: 'number' }
    ]
  },
  {
    key: 'valheim',
    name: 'Valheim',
    fields: [
      { label: 'Server Name', name: 'serverName', type: 'text' },
      { label: 'World Name', name: 'worldName', type: 'text' },
      { label: 'Password', name: 'password', type: 'text' }
    ]
  },
  {
    key: 'projectzomboid',
    name: 'Project Zomboid',
    fields: [
      { label: 'Server Name', name: 'PublicName', type: 'text' },
      { label: 'Password', name: 'Password', type: 'text' },
      { label: 'Max Players', name: 'MaxPlayers', type: 'number' }
    ]
  }
];

export default function GameServerSettings() {
  type SettingsType = {
    [key: string]: { [field: string]: string | number | boolean };
  };
  const [settings, setSettings] = useState<SettingsType>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedField, setSelectedField] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/game-server-settings', { credentials: 'include' });
        if (res.status === 401) {
          // not authenticated as admin
          window.location.href = '/admin/login';
          return;
        }
        if (!res.ok) {
          const body = await res.text();
          setError('Failed to load settings: ' + body);
          setLoading(false);
          return;
        }
        const data = await res.json();
        setSettings(data);
        setLoading(false);
      } catch (e) {
        setError('Failed to load settings');
        setLoading(false);
      }
    })();
  }, []);

  const handleChange = (serverKey: string, field: string, value: string | number | boolean) => {
    setSettings(prev => ({
      ...prev,
      [serverKey]: {
        ...prev[serverKey],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    // Validate known field types (numbers/checkboxes)
    const validation = validateSettings(settings);
    if (!validation.valid) {
      setError('Validation failed: ' + validation.errors.join('; '));
      setLoading(false);
      return;
    }

    // Normalize values (numbers/booleans) before sending
    const payload = normalizeSettings(settings);

    try {
      const res = await fetch('/api/admin/game-server-settings', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.status === 401) {
        window.location.href = '/admin/login';
        return;
      }
      if (res.ok) {
        setSuccessMessage('Settings saved');
        setMessageType('success');
        setLoading(false);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else if (res.status === 400) {
        const body = await res.json();
        const msg = body?.errors ? body.errors.join('; ') : body?.error || 'Validation failed';
        setError('Failed to save settings: ' + msg);
        setMessageType('error');
        setLoading(false);
      } else {
        const text = await res.text();
        setError('Failed to save settings: ' + text);
        setMessageType('error');
        setLoading(false);
      }
    } catch (e) {
      setError('Failed to save settings');
      setMessageType('error');
      setLoading(false);
    }
  };

  // Validate settings according to serverList field types
  function validateSettings(s: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    serverList.forEach(server => {
      const fields = server.fields;
      if (!fields) return;
      fields.forEach((f: any) => {
        const val = s[server.key]?.[f.name];
        if (f.type === 'number') {
          if (val === undefined || val === '' || Number.isNaN(Number(val))) {
            errors.push(`${server.name}: ${f.label} must be a number`);
          }
        }
        if (f.type === 'checkbox') {
          if (val !== undefined && typeof val !== 'boolean') {
            // allow strings 'true'/'false'
            if (!(val === 'true' || val === 'false')) {
              errors.push(`${server.name}: ${f.label} must be a boolean`);
            }
          }
        }
      });
    });
    return { valid: errors.length === 0, errors };
  }

  // Normalize settings: convert numeric strings to numbers and 'true'/'false' to booleans
  function normalizeSettings(s: any) {
    const out: any = {};
    Object.entries(s).forEach(([serverKey, fields]) => {
      out[serverKey] = {} as any;
      Object.entries(fields || {}).forEach(([k, v]: any) => {
        if (typeof v === 'string') {
          const trimmed = v.trim();
          if (/^[+-]?\d+$/.test(trimmed)) {
            out[serverKey][k] = Number(trimmed);
            return;
          }
          if (/^[+-]?\d+\.\d+$/.test(trimmed)) {
            out[serverKey][k] = Number(trimmed);
            return;
          }
          if (trimmed === 'true') {
            out[serverKey][k] = true;
            return;
          }
          if (trimmed === 'false') {
            out[serverKey][k] = false;
            return;
          }
          out[serverKey][k] = trimmed;
        } else {
          out[serverKey][k] = v;
        }
      });
    });
    return out;
  }

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{color:'red'}}>{error}</div>;

  return (
    <Layout>
      <AnimatedBackground />
      <div style={components.container}>
        <AdminHeader
          title="⚙️ Game Server Settings"
          subtitle="Configure game server parameters"
        />

      {/* Palworld settings - dropdown to pick which keys to edit */}
      <div style={components.card}>
        <h2 style={{ ...components.cardTitle, marginBottom: spacing.md }}>Palworld</h2>
        {settings.palworld ? (
          (() => {
            const keys = Object.keys(settings.palworld as Record<string, any>);
            const sel = selectedField['palworld'] || 'all';
            const toShow = sel === 'all' ? keys : [sel];
            return (
              <div>
                <div style={{marginBottom: spacing.md}}>
                  <label style={components.label}>Choose setting to edit</label>
                  <select value={sel} onChange={e => setSelectedField(prev => ({...prev, palworld: e.target.value}))} style={components.input}>
                    <option value="all">All</option>
                    {keys.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
                {toShow.map(key => (
                  <div key={key} style={{marginBottom: spacing.md}}>
                    <label style={components.label}>{key}</label>
                    <input
                      type={typeof (settings.palworld as any)[key] === 'number' ? 'number' : 'text'}
                      value={String((settings.palworld as any)[key] ?? '')}
                      onChange={e => handleChange('palworld', key, e.target.value)}
                      style={components.input}
                    />
                  </div>
                ))}
              </div>
            );
          })()
        ) : (
          <div>No Palworld settings found.</div>
        )}
      </div>

      {/* Other servers (dropdown to choose field to edit) */}
      {serverList.filter(s => s.key !== 'palworld').map(server => (
        <div key={server.key} style={components.card}>
          <h2 style={{ ...components.cardTitle, marginBottom: spacing.md }}>{server.name}</h2>
          {server.fields ? (
            (() => {
              const sel = selectedField[server.key] || 'all';
              const options = server.fields as {label:string,name:string,type:string}[];
              const toShow = sel === 'all' ? options : options.filter(o => o.name === sel);
              return (
                <div>
                  <div style={{marginBottom: spacing.md}}>
                    <label style={components.label}>Choose field to edit</label>
                    <select value={sel} onChange={e => setSelectedField(prev => ({...prev, [server.key]: e.target.value}))} style={components.input}>
                      <option value="all">All</option>
                      {options.map(o => <option key={o.name} value={o.name}>{o.label}</option>)}
                    </select>
                  </div>
                  {toShow.map(field => (
                    <div key={field.name} style={{marginBottom: spacing.md}}>
                      <label style={components.label}>{field.label}</label>
                      {field.type === 'checkbox' ? (
                        <input
                          type="checkbox"
                          checked={!!settings[server.key]?.[field.name]}
                          onChange={e => handleChange(server.key, field.name, !!e.target.checked)}
                        />
                      ) : (
                        <input
                          type={field.type}
                          value={String(settings[server.key]?.[field.name] ?? '')}
                          onChange={e => {
                            const val = field.type === 'number' ? Number(e.target.value) : e.target.value;
                            handleChange(server.key, field.name, val);
                          }}
                          style={components.input}
                        />
                      )}
                    </div>
                  ))}
                </div>
              );
            })()
          ) : (
            <div style={{ color: colors.text.secondary }}>No editable fields defined for this server.</div>
          )}
        </div>
      ))}

      <button onClick={handleSave} style={{ ...components.buttonPrimary, padding: '12px 32px', fontSize: '18px', marginTop: spacing.md }}>
        Save All
      </button>
      </div>
    </Layout>
  );
}
