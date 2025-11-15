import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import { ToastContainer, toast } from 'react-toastify';
import { auth } from "../../firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { useSelector } from "react-redux";

export default function ForgotPasswordForm() {
    const { user } = useSelector((state) => ({ ...state }));
    const [email, setEmail] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        const config = {
            url: import.meta.env.VITE_FORGOT_PASSWORD_REDIRECT,
            handleCodeInApp: true,
        };

        try {
            await sendPasswordResetEmail(auth, email, config);
            setEmail("");
            toast.success("Check your email for password reset link");
        } catch (error) {
            toast.error(error.message);
            console.log("ERROR MSG IN FORGOT PASSWORD", error);
        }
    };

    useEffect(() => {
        if (user && user.token) navigate("/");
    }, [user]);

    return (
        <div className="flex flex-col flex-1 w-full overflow-y-auto lg:w-1/2 no-scrollbar">
            <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
                <div className="mb-5 sm:mb-8 flex justify-center items-center">
                    <div className="mb-2 font-semibold text-gray-800 text-[24px] dark:text-white/90 sm:text-[32px]">
                        Forgot Password
                    </div>
                </div>
                <ToastContainer />
                <form onSubmit={handleSubmit} method="POST">
                    <div className="space-y-5">
                        <div>
                            <Label>Email<span className="text-error-500">*</span></Label>
                            <Input
                                type="text"
                                name="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e?.target?.value)}
                            />
                        </div>
                        <div>
                            <button
                                type="submit"
                                className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600"
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
