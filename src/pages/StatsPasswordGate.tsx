import { useState, type FormEvent } from 'react';
import { FaLock, FaChartBar } from 'react-icons/fa';

const AUTH_KEY = 'kgp_admin_authed';
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD as string | undefined;

export function isStatsAuthed(): boolean {
  try {
    return sessionStorage.getItem(AUTH_KEY) === '1';
  } catch {
    return false;
  }
}

interface StatsPasswordGateProps {
  onAuthed: () => void;
}

/**
 * Simple password gate for /thong-ke. Not meant as real multi-user auth
 * (there's no login system on this site) — just a single shared
 * passphrase set via VITE_ADMIN_PASSWORD, kept out of the bundle's
 * source and only compared client-side. Good enough to keep casual
 * visitors out of the dashboard; not a substitute for a proper backend
 * auth if the stats ever need to be truly private.
 */
export default function StatsPasswordGate({ onAuthed }: StatsPasswordGateProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!ADMIN_PASSWORD) {
      setError('Chưa cấu hình VITE_ADMIN_PASSWORD trong file .env');
      return;
    }

    if (password === ADMIN_PASSWORD) {
      try {
        sessionStorage.setItem(AUTH_KEY, '1');
      } catch {
        /* ignore — auth just won't persist across tabs/refresh */
      }
      onAuthed();
    } else {
      setError('Sai mật khẩu, vui lòng thử lại.');
      setPassword('');
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-gray-800 bg-gray-900 p-8 text-center"
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-red-600/15 text-red-500">
          <FaChartBar className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold text-white">Thống Kê Truy Cập</h1>
        <p className="mt-1 text-sm text-gray-400">Nhập mật khẩu quản trị để tiếp tục</p>

        <div className="relative mt-6">
          <FaLock className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            placeholder="Mật khẩu"
            className="w-full rounded-lg border border-gray-700 bg-gray-950 py-2.5 pl-10 pr-3 text-sm text-white placeholder-gray-600 outline-none focus:border-red-500"
          />
        </div>

        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

        <button
          type="submit"
          className="mt-5 w-full rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
        >
          Truy cập
        </button>
      </form>
    </div>
  );
}
