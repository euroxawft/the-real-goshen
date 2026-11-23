
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { getSetupStatus, setup as setupAdmin } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';

export default function AdminSetup() {
  const router = useRouter();

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    getSetupStatus()
      .then((data) => {
        if (!data.needsSetup) {
          router.replace('/admin/login');
        } else {
          setChecking(false);
        }
      })
      .catch(() => setChecking(false));
  }, [router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError('');
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);

    try {
      await setupAdmin({
        name: (formData.get('name') as string).trim(),
        email: (formData.get('email') as string).trim(),
        password: formData.get('password') as string,
        setupSecret: formData.get('secret') as string,
      });

      router.push('/admin');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (checking) {
    return (
      <div className="setup-loading">
        <div className="setup-spinner" />
        <p>Checking setup status...</p>

        <style jsx>{`
          .setup-loading {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 16px;
            background: #111827;
            color: #f9fafb;
          }

          .setup-loading p {
            color: #d1d5db;
            font-size: 14px;
          }

          .setup-spinner {
            width: 32px;
            height: 32px;
            border: 3px solid #374151;
            border-top-color: #d6a84b;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <main className="setup-page">
      <form className="setup-card" onSubmit={submit}>
        <div className="setup-logo">
          <Image
            src="/trg-logo-600.jpg"
            alt="TRG Studio"
            width={100}
            height={100}
            priority
          />
        </div>

        <div className="setup-heading">
          <span className="setup-eyebrow">ONE-TIME SETUP</span>

          <h1>Create your admin account</h1>

          <p>
            Set up your private administrator account to manage your studio.
            This setup is only available once.
          </p>
        </div>

        <div className="setup-fields">
          <div className="setup-field">
            <label htmlFor="admin-name">Full name</label>
            <input
              id="admin-name"
              name="name"
              type="text"
              placeholder="Enter your full name"
              autoComplete="name"
              minLength={2}
              maxLength={120}
              required
            />
          </div>

          <div className="setup-field">
            <label htmlFor="admin-email">Email address</label>
            <input
              id="admin-email"
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="setup-field">
            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              name="password"
              type="password"
              placeholder="Minimum 10 characters"
              autoComplete="new-password"
              minLength={10}
              required
            />
            <span className="field-hint">
              Use a strong password with at least 10 characters, including
              letters and numbers.
            </span>
          </div>

          <div className="setup-field">
            <label htmlFor="admin-secret">Admin setup secret</label>
            <input
              id="admin-secret"
              name="secret"
              type="password"
              placeholder="Enter your ADMIN_SETUP_SECRET"
              autoComplete="off"
              required
            />
            <span className="field-hint">
              This must match the ADMIN_SETUP_SECRET configured on your
              backend.
            </span>
          </div>
        </div>

        {error && (
          <div className="setup-error" role="alert">
            <span className="error-icon">!</span>
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          className="setup-submit"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <span className="button-spinner" />
              Creating account...
            </>
          ) : (
            'Create admin account'
          )}
        </button>

        <Link href="/" className="setup-back">
          ← Back to website
        </Link>

        <div className="setup-footer">
          <span>TRG STUDIO</span>
          <span>Secure administrator access</span>
        </div>
      </form>

      <style jsx>{`
        .setup-page {
          min-height: 100vh;
          padding: 48px 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #111827;
          font-family: inherit;
        }

        .setup-card {
          width: 100%;
          max-width: 460px;
          padding: 36px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 18px;
          box-shadow: 0 24px 70px rgba(0, 0, 0, 0.3);
        }

        .setup-logo {
          display: flex;
          justify-content: center;
          margin-bottom: 24px;
        }

        .setup-logo :global(img) {
          object-fit: cover;
          border-radius: 14px;
        }

        .setup-heading {
          margin-bottom: 28px;
          text-align: center;
        }

        .setup-eyebrow {
          display: inline-block;
          margin-bottom: 12px;
          color: #a77923;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 2px;
        }

        .setup-heading h1 {
          margin: 0 0 10px;
          color: #111827;
          font-size: 27px;
          line-height: 1.3;
          font-weight: 750;
        }

        .setup-heading p {
          margin: 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.7;
        }

        .setup-fields {
          display: flex;
          flex-direction: column;
          gap: 19px;
        }

        .setup-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .setup-field label {
          display: block;
          color: #1f2937;
          font-size: 13px;
          font-weight: 700;
        }

        .setup-field input {
          display: block;
          width: 100%;
          min-height: 48px;
          padding: 12px 14px;
          border: 1px solid #cbd5e1;
          border-radius: 9px;
          outline: none;
          background-color: #f8fafc;
          color: #111827;
          font-family: inherit;
          font-size: 14px;
          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease,
            background-color 0.2s ease;
        }

        .setup-field input::placeholder {
          color: #94a3b8;
          opacity: 1;
        }

        .setup-field input:hover {
          border-color: #94a3b8;
        }

        .setup-field input:focus {
          border-color: #b88932;
          background-color: #ffffff;
          box-shadow: 0 0 0 3px rgba(184, 137, 50, 0.16);
        }

        .field-hint {
          color: #64748b;
          font-size: 11px;
          line-height: 1.5;
        }

        .setup-error {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-top: 20px;
          padding: 12px 14px;
          border: 1px solid #fecaca;
          border-radius: 9px;
          background: #fef2f2;
          color: #b91c1c;
          font-size: 13px;
          line-height: 1.5;
        }

        .error-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 19px;
          height: 19px;
          border-radius: 50%;
          background: #fee2e2;
          color: #b91c1c;
          font-size: 12px;
          font-weight: 800;
        }

        .setup-submit {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          min-height: 50px;
          margin-top: 26px;
          padding: 12px 18px;
          border: none;
          border-radius: 9px;
          background: #b88932;
          color: #ffffff;
          font-family: inherit;
          font-size: 14px;
          font-weight: 750;
          cursor: pointer;
          transition:
            background 0.2s ease,
            transform 0.2s ease;
        }

        .setup-submit:hover:not(:disabled) {
          background: #966b20;
          transform: translateY(-1px);
        }

        .setup-submit:disabled {
          cursor: not-allowed;
          opacity: 0.65;
        }

        .button-spinner {
          width: 17px;
          height: 17px;
          border: 2px solid rgba(255, 255, 255, 0.35);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        .setup-back {
          display: block;
          margin-top: 20px;
          color: #966b20;
          text-align: center;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
        }

        .setup-back:hover {
          color: #694913;
          text-decoration: underline;
        }

        .setup-footer {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          margin-top: 28px;
          padding-top: 18px;
          border-top: 1px solid #e5e7eb;
          color: #94a3b8;
          font-size: 10px;
          letter-spacing: 0.5px;
        }

        .setup-footer span:first-child {
          color: #64748b;
          font-weight: 800;
          letter-spacing: 1.5px;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 480px) {
          .setup-page {
            padding: 24px 14px;
          }

          .setup-card {
            padding: 26px 20px;
          }

          .setup-heading h1 {
            font-size: 23px;
          }
        }
      `}</style>
    </main>
  );
}
