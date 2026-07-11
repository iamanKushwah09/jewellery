import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@windmill/react-ui";
import { useTranslation } from "react-i18next";

//internal import
import Error from "@/components/form/others/Error";
import LabelArea from "@/components/form/selectOption/LabelArea";
import InputArea from "@/components/form/input/InputArea";
import PasswordInput from "@/components/form/input/PasswordInput";
import useLoginSubmit from "@/hooks/useLoginSubmit";
import CMButton from "@/components/form/button/CMButton";

const Login = () => {
  const { t } = useTranslation();
  const { onSubmit, register, handleSubmit, errors, loading } =
    useLoginSubmit();

  return (
    <>
      <div
        className="flex items-center min-h-screen p-6"
        style={{ background: 'linear-gradient(135deg, #1A1209 0%, #2D2418 50%, #1A1209 100%)' }}
      >
        {/* Decorative gold blobs */}
        <div
          className="fixed top-0 left-0 w-96 h-96 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'rgba(201,146,10,0.08)' }}
        />
        <div
          className="fixed bottom-0 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'rgba(107,26,26,0.1)' }}
        />

        <div
          className="flex-1 h-full max-w-4xl mx-auto overflow-hidden shadow-2xl relative z-10"
          style={{ background: 'rgba(255,253,248,0.97)', borderRadius: '2px', border: '1px solid rgba(201,146,10,0.2)' }}
        >
          <div className="flex flex-col overflow-y-auto md:flex-row">
            {/* Left Panel — Gold Brand Panel */}
            <div
              className="h-48 md:h-auto md:w-1/2 flex flex-col items-center justify-center p-8 relative overflow-hidden"
              style={{ background: 'linear-gradient(160deg, #1A1209 0%, #2D2418 60%, #4A3520 100%)' }}
            >
              {/* Gold shimmer overlay */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at 30% 30%, rgba(201,146,10,0.15) 0%, transparent 60%)' }}
              />
              {/* Decorative lines */}
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ background: 'linear-gradient(90deg, transparent, #C9920A, #E8B84B, #C9920A, transparent)' }}
              />
              <div
                className="absolute bottom-0 left-0 right-0 h-px"
                style={{ background: 'rgba(201,146,10,0.3)' }}
              />

              {/* Diamond Logo */}
              <div
                className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center mb-6 relative z-10"
                style={{
                  background: 'linear-gradient(135deg, #8B6508, #C9920A, #E8B84B)',
                  borderRadius: '2px',
                  boxShadow: '0 8px 32px rgba(201,146,10,0.4)',
                }}
              >
                <svg className="w-8 h-8 md:w-10 md:h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l2.4 6h6.6l-5.3 3.9 2 6.1L12 14l-5.7 4 2-6.1L3 8h6.6z"/>
                </svg>
              </div>

              <div className="text-center relative z-10">
                <h2
                  className="text-3xl md:text-4xl font-bold text-white tracking-wide mb-1"
                  style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', letterSpacing: '0.15em' }}
                >
                  Vellora
                </h2>
                <p
                  className="text-xs tracking-[0.4em] mb-6 uppercase"
                  style={{ color: '#C9920A', fontFamily: '"Cormorant Garamond", Georgia, serif' }}
                >
                  JEWELS
                </p>
                <div
                  className="h-px w-20 mx-auto mb-6"
                  style={{ background: 'linear-gradient(90deg, transparent, #C9920A, transparent)' }}
                />
                <p
                  className="text-sm italic text-white/60"
                  style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
                >
                  "Crafting Moments, Forever."
                </p>
                <p className="text-xs text-white/40 tracking-widest uppercase mt-3">Admin Panel</p>
              </div>
            </div>

            {/* Right Panel — Login Form */}
            <main className="flex items-center justify-center p-8 sm:p-12 md:w-1/2">
              <div className="w-full">
                <div className="mb-8">
                  <h1
                    className="text-2xl font-bold text-gray-900 mb-1"
                    style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
                  >
                    Welcome Back
                  </h1>
                  <div
                    className="h-px w-12 mb-3"
                    style={{ background: '#C9920A' }}
                  />
                  <p className="text-sm text-gray-500 tracking-wide">Sign in to manage your jewellery store</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="mb-4">
                    <LabelArea label="Email" />
                    <InputArea
                      required={true}
                      register={register}
                      defaultValue="admin@gmail.com"
                      label="Email"
                      name="email"
                      type="email"
                      autoComplete="username"
                      placeholder="admin@Vellorajewels.com"
                    />
                    <Error errorName={errors.email} />
                  </div>

                  <div className="mt-4">
                    <LabelArea label="Password" />
                    <PasswordInput
                      required={true}
                      register={register}
                      defaultValue="12345678"
                      label="Password"
                      name="password"
                      autoComplete="current-password"
                      placeholder="***************"
                    />
                    <Error errorName={errors.password} />
                  </div>

                  {loading ? (
                    <CMButton
                      disabled={loading}
                      type="submit"
                      className="mt-6 h-12 w-full"
                      style={{ background: 'linear-gradient(135deg, #8B6508, #C9920A)', borderRadius: '0' }}
                      to="/dashboard"
                    />
                  ) : (
                    <button
                      disabled={loading}
                      type="submit"
                      className="mt-6 h-12 w-full text-white font-bold text-sm uppercase tracking-[0.15em] transition-all hover:opacity-90 active:scale-[0.98]"
                      style={{
                        background: 'linear-gradient(135deg, #8B6508, #C9920A)',
                        borderRadius: '0',
                      }}
                    >
                      {t("LoginTitle")}
                    </button>
                  )}
                </form>

                <div className="mt-6 flex flex-col gap-2">
                  <Link
                    className="text-sm font-medium hover:underline transition-colors"
                    style={{ color: '#C9920A' }}
                    to="/forgot-password"
                  >
                    {t("ForgotPassword")}
                  </Link>
                  <Link
                    className="text-sm font-medium hover:underline transition-colors"
                    style={{ color: '#C9920A' }}
                    to="/signup"
                  >
                    {t("CreateAccountTitle")}
                  </Link>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
