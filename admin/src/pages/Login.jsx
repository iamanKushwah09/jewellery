import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui";
import { useTranslation } from "react-i18next";

// internal import
import Error from "@/components/form/others/Error";
import LabelArea from "@/components/form/selectOption/LabelArea";
import InputArea from "@/components/form/input/InputArea";
import PasswordInput from "@/components/form/input/PasswordInput";
import loginOfficeHd from "@/assets/img/login-office-hd.jpg";
import useLoginSubmit from "@/hooks/useLoginSubmit";
import useUtilsFunction from "@/hooks/useUtilsFunction";
import CMButton from "@/components/form/button/CMButton";

const Login = () => {
  const { t } = useTranslation();
  const { onSubmit, register, handleSubmit, errors, loading } =
    useLoginSubmit();
  const { globalSetting } = useUtilsFunction();

  const companyName = globalSetting?.company_name || globalSetting?.shop_name || "";
  const companyLogo = globalSetting?.logo;

  const getInitials = (name) => {
    if (!name || typeof name !== "string") return "";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white shadow-[0_20px_60px_-15px_rgba(15,23,42,0.15)] transition-all">
        <div className="flex flex-col md:flex-row md:min-h-[560px]">
          {/* Responsive HD Image Left Panel */}
          <div className="relative h-52 sm:h-64 md:h-auto md:w-1/2 overflow-hidden bg-slate-900 group">
            <img
              aria-hidden="true"
              className="object-cover w-full h-full transition-transform duration-700 ease-out group-hover:scale-105"
              src={loginOfficeHd}
              alt="Office Workspace"
            />
            {/* Subtle top gradient shadow for badge readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/30 pointer-events-none" />

            {/* Floating Brand Chip */}
            {(companyName || companyLogo) ? (
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/60 backdrop-blur-md border border-white/20 text-white shadow-lg">
                {companyLogo ? (
                  <img
                    src={companyLogo}
                    alt={companyName || "Logo"}
                    className="h-5 w-auto max-w-[24px] object-contain rounded"
                    onError={(e) => {
                      e.target.style.display = "none";
                      if (e.target.nextSibling) {
                        e.target.nextSibling.style.display = "flex";
                      }
                    }}
                  />
                ) : null}
                {companyName ? (
                  <div
                    className={`${companyLogo ? "hidden" : "flex"} h-5 w-5 items-center justify-center rounded bg-primary text-[10px] font-bold text-white`}
                  >
                    {getInitials(companyName)}
                  </div>
                ) : null}
                {companyName ? (
                  <span className="text-xs font-semibold tracking-wide">{companyName}</span>
                ) : null}
              </div>
            ) : null}

            {/* Enterprise Portal Chip */}
            <div className="absolute bottom-4 left-4 z-10 hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/60 backdrop-blur-md border border-white/20 text-[11px] text-slate-200 shadow-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Enterprise Commerce Portal
            </div>
          </div>

          {/* Form Right Area */}
          <main className="flex flex-1 items-center justify-center p-8 sm:p-12 lg:p-14 bg-white">
            <div className="w-full max-w-md">
              <div className="mb-8">
                <span className="inline-block px-3 py-1 text-xs font-semibold text-primary bg-primary/10 rounded-full mb-3">
                  Secure Admin Portal
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
                  Sign In
                </h1>
                <p className="mt-2 text-xs sm:text-sm text-gray-500">
                  Welcome back! Enter your credentials to access {companyName ? <strong className="text-gray-700">{companyName}</strong> : "the"} portal.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <LabelArea label="Email Address" />
                  <InputArea
                    required={true}
                    register={register}
                    defaultValue="admin@gmail.com"
                    label="Email"
                    name="email"
                    type="email"
                    autoComplete="username"
                    placeholder="admin@example.com"
                  />
                  <Error errorName={errors.email} />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <LabelArea label="Password" />
                    <Link
                      to="/forgot-password"
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      {t("ForgotPassword")}
                    </Link>
                  </div>
                  <PasswordInput
                    required={true}
                    register={register}
                    defaultValue="12345678"
                    label="Password"
                    name="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                  />
                  <Error errorName={errors.password} />
                </div>

                <div className="pt-2">
                  {loading ? (
                    <CMButton
                      disabled={loading}
                      type="submit"
                      className="h-11 w-full rounded-xl bg-primary text-white"
                      to="/dashboard"
                    />
                  ) : (
                    <Button
                      disabled={loading}
                      type="submit"
                      block
                      size="large"
                      className="h-11 w-full rounded-xl font-semibold shadow-sm"
                      to="/dashboard"
                    >
                      {t("LoginTitle")}
                    </Button>
                  )}
                </div>
              </form>

              <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs text-gray-500">
                <span>Don&apos;t have an account? </span>
                <Link
                  to="/signup"
                  className="font-semibold text-primary hover:underline ml-1"
                >
                  {t("CreateAccountTitle")}
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Login;
