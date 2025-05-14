"use client";
import { signIn } from "next-auth/react";

export default function SignInPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-blue-50 px-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full flex flex-col items-center">
        <h1 className="text-3xl font-bold text-green-900 mb-2 text-center">Sign in to Exclusive Lex</h1>
        <p className="text-green-800 mb-8 text-center">Access exclusive content and manage your account</p>
        <button
          onClick={() => signIn("google")}
          className="flex items-center gap-3 bg-green-900 text-white px-6 py-3 rounded-lg font-semibold text-lg shadow hover:bg-green-800 transition mb-4 w-full justify-center"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
            <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
            <g id="SVGRepo_iconCarrier">
              <path d="M21.805 10.023h-9.765v3.977h5.617c-.242 1.242-1.242 3.648-5.617 3.648-3.375 0-6.125-2.789-6.125-6.148 0-3.359 2.75-6.148 6.125-6.148 1.922 0 3.211.82 3.953 1.523l2.703-2.625c-1.703-1.57-3.898-2.523-6.656-2.523-5.523 0-10 4.477-10 10s4.477 10 10 10c5.742 0 9.547-4.023 9.547-9.695 0-.652-.07-1.148-.156-1.477z" fill="#fff"/>
              <path d="M12.04 22c2.7 0 4.963-.89 6.617-2.42l-3.148-2.57c-.867.617-2.047 1.047-3.469 1.047-2.664 0-4.922-1.797-5.734-4.211h-3.203v2.633c1.664 3.281 5.102 5.521 8.937 5.521z" fill="#34A853"/>
              <path d="M6.306 13.846c-.197-.586-.309-1.211-.309-1.846s.112-1.26.309-1.846v-2.633h-3.203c-.648 1.297-1.023 2.75-1.023 4.479s.375 3.182 1.023 4.479l3.203-2.633z" fill="#FBBC05"/>
              <path d="M21.805 10.023h-9.765v3.977h5.617c-.242 1.242-1.242 3.648-5.617 3.648-3.375 0-6.125-2.789-6.125-6.148 0-3.359 2.75-6.148 6.125-6.148 1.922 0 3.211.82 3.953 1.523l2.703-2.625c-1.703-1.57-3.898-2.523-6.656-2.523-5.523 0-10 4.477-10 10s4.477 10 10 10c5.742 0 9.547-4.023 9.547-9.695 0-.652-.07-1.148-.156-1.477z" fill="#4285F4"/>
              <path d="M12.04 22c2.7 0 4.963-.89 6.617-2.42l-3.148-2.57c-.867.617-2.047 1.047-3.469 1.047-2.664 0-4.922-1.797-5.734-4.211h-3.203v2.633c1.664 3.281 5.102 5.521 8.937 5.521z" fill="#34A853"/>
              <path d="M6.306 13.846c-.197-.586-.309-1.211-.309-1.846s.112-1.26.309-1.846v-2.633h-3.203c-.648 1.297-1.023 2.75-1.023 4.479s.375 3.182 1.023 4.479l3.203-2.633z" fill="#FBBC05"/>
            </g>
          </svg>
          Sign in with Google
        </button>
      </div>
    </div>
  );
} 