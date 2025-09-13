import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import OTPInput from '@/components/ui/otp-input';
import type { LoginRequest } from '@/types/auth.types';
import { VALIDATION_MESSAGES } from '@/utils/validation';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import bg from '@/assets/login-background.png';
import logo from '@/assets/logo_white_bg.png';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/auth.service';
import RedirectIfAuthenticated from '@/components/auth/RedirectIfAuthenticated';
import { toast } from 'react-hot-toast';

const INITIAL_VALUES: LoginRequest = {
    email: '',
    password: '',
    mfaCode: '',
};

const Login: React.FC = () => {
    const navigate = useNavigate();
    const { token, login, logout, setToken } = useAuth();
    const [showMfaField, setShowMfaField] = useState(false);

    const handleLogin = async (data: LoginRequest) => {
        const response = await authService.login(data);

        if (response.error) {
            console.log(response.error.errors?.[0]);
            if (response.error.errors?.[0] === 'Invalid credentials') {
                toast.error('Email ou Mot de passe incorrect');
            } else if (response.error.errors?.[0] === 'Account is not active') {
                toast.error(
                    `Compte inactif. Veuillez consulter vos mails et récuperer votre code de validation à cet adresse : ${data.email}`
                );
                localStorage.setItem('verificationEmail', data.email);
                navigate('/verify-email');
            } else {
                toast.error(response.error.message || 'Échec de connexion');
            }
            return false;
        }

        if (!response.data) {
            toast.error('Réponse invalide du serveur');
            return false;
        }

        // Check if MFA is required
        if (response.data.requiresMFA) {
            setShowMfaField(true);

            toast('Code MFA requis', {
                icon: '⚠️',
            });
            return false;
        }

        // Successful login
        if (response.data.data) {
            setToken(response.data.data.accessToken, response.data.data.expiresIn);
        }
    };

    useEffect(() => {
        const getUserProfile = async () => {
            const response = await authService.getProfile();

            if (response.error) {
                console.log(response.error.errors?.[0]);
                toast.error(response.error.message || 'Échec de connexion');
                logout();
                return false;
            }

            if (!response.data) {
                toast.error('Réponse invalide du serveur');
                return false;
            }
            toast.success('Connexion réussie');
            console.log(response.data);
            login(response.data.data);
        };

        if (token) {
            getUserProfile();
        }
    }, [token, login, logout]);

    return (
        <RedirectIfAuthenticated>
            <div className="min-h-screen flex">
                {/* Left side - Form */}
                <div className="flex-1 flex items-center justify-center p-8 md:mr-8">
                    <div className="w-full xl:max-w-3/4 md:max-w-xl">
                        <div className="text-center mb-8">
                            <h1 className="text-4xl font-medium mb-2 text-tsa-blue">Heureux de vous Revoir</h1>
                            <p className="text-sm font-semibold text-tsa-gray">
                                Vivez votre logistique en toute confiance
                            </p>
                        </div>

                        <Card className="shadow-xl bg-[#D9D9D980]">
                            <CardContent className="px-8">
                                <Formik<LoginRequest>
                                    initialValues={INITIAL_VALUES}
                                    validationSchema={Yup.object({
                                        email: Yup.string()
                                            .trim()
                                            .required(VALIDATION_MESSAGES.REQUIRED_EMAIL)
                                            .email(VALIDATION_MESSAGES.INVALID_EMAIL),
                                        password: Yup.string().required(VALIDATION_MESSAGES.REQUIRED_PASSWORD),
                                        mfaCode: showMfaField
                                            ? Yup.string()
                                                .required('Code MFA requis')
                                                .matches(/^\d{6}$/, 'Le code MFA doit contenir exactement 6 chiffres')
                                            : Yup.string(),
                                    })}
                                    onSubmit={async (data: LoginRequest, { setSubmitting }) => {
                                        try {
                                            setSubmitting(true);
                                            if (showMfaField)
                                                await handleLogin({
                                                    email: data.email.trim(),
                                                    password: data.password,
                                                    mfaCode: data.mfaCode,
                                                });
                                            else
                                                await handleLogin({
                                                    email: data.email.trim(),
                                                    password: data.password,
                                                });
                                        } catch (error) {
                                            console.error('Login failed:', error);
                                        } finally {
                                            setSubmitting(false);
                                        }
                                    }}
                                    validateOnBlur={true}
                                    validateOnChange={true}
                                >
                                    {({
                                        values,
                                        errors,
                                        touched,
                                        handleChange,
                                        handleBlur,
                                        setFieldValue,
                                        isSubmitting,
                                    }) => (
                                        <Form className="space-y-4">
                                            <div className="flex flex-col gap-2">
                                                <Input
                                                    name="email"
                                                    type="email"
                                                    placeholder="Entrez votre Email"
                                                    value={values.email}
                                                    onChange={handleChange}
                                                    onBlur={handleBlur}
                                                    aria-invalid={touched.email && !!errors.email}
                                                    className="h-12 border-tsa-blue placeholder:text-tsa-blue/90 placeholder:text-sm placeholder:font-medium"
                                                    required
                                                    disabled={showMfaField}
                                                />
                                                {touched.email && errors.email ? (
                                                    <div className="text-sm text-red-600">{errors.email}</div>
                                                ) : null}
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                <Input
                                                    name="password"
                                                    type="password"
                                                    placeholder="Entrez votre Mot de passe"
                                                    value={values.password}
                                                    onChange={handleChange}
                                                    onBlur={handleBlur}
                                                    aria-invalid={touched.password && !!errors.password}
                                                    className="h-12 border-tsa-blue placeholder:text-tsa-blue/90 placeholder:text-sm placeholder:font-medium"
                                                    required
                                                    disabled={showMfaField}
                                                />
                                                <div className="flex justify-between">
                                                    <div className="w-1/2 text-sm text-red-600">
                                                        {touched.password && errors.password ? errors.password : null}
                                                        { }
                                                    </div>
                                                    {!showMfaField && (
                                                        <Link
                                                            to="/forgot-password"
                                                            className="text-tsa-blue text-sm font-medium"
                                                        >
                                                            Mot de passe oublié ?
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>

                                            {showMfaField && (
                                                <div className="flex flex-col gap-4">
                                                    <div className="text-center">
                                                        <p className="text-sm text-tsa-gray mb-2">
                                                            Entrez le code à 6 chiffres de votre application d'authentification
                                                        </p>
                                                    </div>
                                                    <OTPInput
                                                        length={6}
                                                        value={values.mfaCode || ''}
                                                        onChange={(value) => {
                                                            handleChange({
                                                                target: {
                                                                    name: 'mfaCode',
                                                                    value: value,
                                                                },
                                                            });
                                                        }}
                                                        disabled={isSubmitting}
                                                        className="mb-2"
                                                        autoFocus={showMfaField}
                                                    />
                                                    {touched.mfaCode && errors.mfaCode ? (
                                                        <div className="text-sm text-red-600 text-center">{errors.mfaCode}</div>
                                                    ) : null}
                                                    <div className="text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setShowMfaField(false);
                                                                setFieldValue('mfaCode', '');
                                                            }}
                                                            className="text-tsa-blue text-sm font-medium"
                                                        >
                                                            Retour à la connexion
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            <Button
                                                type="submit"
                                                className="w-4/5 justify-self-center flex h-12 bg-tsa-blue/90 text-white font-semibold text-2xl p-10"
                                                disabled={isSubmitting}
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-8 w-8 border-b-4"></div>
                                                        {showMfaField ? 'VÉRIFICATION...' : 'CONNEXION...'}
                                                    </>
                                                ) : showMfaField ? (
                                                    'VÉRIFIER LE CODE'
                                                ) : (
                                                    'JE ME CONNECTE'
                                                )}
                                            </Button>

                                            {!showMfaField && (
                                                <>
                                                    <div className="text-center">
                                                        <span className="text-gray-600">Pas encore de compte ? </span>
                                                        <Link to="/register" className="text-tsa-blue font-medium">
                                                            Je m'inscris
                                                        </Link>
                                                    </div>
                                                    <div className="text-center">
                                                        <Link to="/verify-email" className="text-tsa-blue font-medium">
                                                            Vérifier mon email
                                                        </Link>
                                                    </div>
                                                </>
                                            )}
                                        </Form>
                                    )}
                                </Formik>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Right side - Image/Graphics placeholder */}
                <div
                    className="hidden lg:flex flex-1 p-8 bg-cover bg-center"
                    style={{ backgroundImage: `url(${bg})` }}
                >
                    <div className="fixed top-3 right-3">
                        <img src={logo} alt="TSA Logistics" width={150} height={150} />
                    </div>
                </div>
            </div>
        </RedirectIfAuthenticated>
    );
};

export default Login;
