import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Formik, Form, type FormikHelpers } from 'formik';
// Validation will be handled by the form component
import bg from '@/assets/login-background.png';
import logo from '@/assets/logo_white_bg.png';
import RedirectIfAuthenticated from '@/components/auth/RedirectIfAuthenticated';
import type { VerifyEmailFormData } from '@/types/forms.types';
import { authService } from '@/services/auth.service';
import toast from 'react-hot-toast';

const INITIAL_VALUES: VerifyEmailFormData = { email: '', token: '' };

const VerifyEmail: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [initialValues, setInitialValues] = useState<VerifyEmailFormData>(INITIAL_VALUES);
    const [isAutoVerifying, setIsAutoVerifying] = useState(false);

    const handleAutoVerification = useCallback(async (values: { email: string; token: string }) => {
        try {
            setIsAutoVerifying(true);
            const response = await authService.verifyEmail({
                token: values.token
            });

            if (response.error) {
                console.error('Auto verification failed:', response.error);
                if (response.error.errors?.[0] === 'Invalid or expired token') {
                    toast.error('Token incorrect');
                }
                return false;
            }

            toast.success('Votre adresse email a été vérifiée avec succès!');
            localStorage.removeItem('verificationEmail');
            navigate('/');
            return true;
        } catch (error) {
            console.error('Verification error:', error);
            toast.error('Une erreur est survenue lors de la vérification');
            return false;
        } finally {
            setIsAutoVerifying(false);
        }
    }, [navigate]);

    // Handle form submission
    const handleSubmit = async (values: VerifyEmailFormData, { setSubmitting }: FormikHelpers<VerifyEmailFormData>) => {
        await handleAutoVerification(values);
        setSubmitting(false);
    };

    useEffect(() => {
        // Get email from localStorage
        const storedEmail = localStorage.getItem('verificationEmail');
        // Get token from URL parameters
        const tokenFromUrl = searchParams.get('token') || '';

        // If token is in URL and email is available, auto-verify
        if (tokenFromUrl && storedEmail) {
            const values = { token: tokenFromUrl, email: storedEmail };
            setInitialValues(values);
            handleAutoVerification(values);
        } else if (storedEmail) {
            setInitialValues(prev => ({ ...prev, email: storedEmail }));
        }
    }, [searchParams, handleAutoVerification]);

    return (
        <RedirectIfAuthenticated>
            <div className="min-h-screen flex">
                <div className="flex-1 flex items-center justify-center p-8 md:mr-8">
                    <div className="w-full xl:max-w-3/4 md:max-w-xl">
                        <div className="text-center mb-8">
                            <h1 className="text-4xl font-medium mb-2 text-tsa-blue">Vérification Email</h1>
                            <p className="text-sm font-semibold text-tsa-gray">
                                Saisissez votre email et le code reçu pour vérifier votre compte
                            </p>
                        </div>

                        <Card className="shadow-xl bg-[#D9D9D980]">
                            <CardContent className="px-8">
                                <Formik<VerifyEmailFormData>
                                    initialValues={initialValues}
                                    enableReinitialize={true}
                                    onSubmit={handleSubmit}
                                    validateOnBlur={true}
                                    validateOnChange={true}
                                >
                                    {({
                                        values,
                                        errors,
                                        touched,
                                        handleChange,
                                        handleBlur,
                                        isSubmitting,
                                    }) => {
                                        // Show loading state during submission or auto-verification
                                        if (isSubmitting || isAutoVerifying) {
                                            return (
                                                <div className="space-y-6 text-center">
                                                    <div className="text-tsa-blue font-medium">
                                                        Vérification automatique en cours...
                                                    </div>
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tsa-blue mx-auto"></div>
                                                </div>
                                            );
                                        }

                                        return (
                                            <Form className="space-y-6">
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
                                                    />
                                                    {touched.email && errors.email ? (
                                                        <div className="text-sm text-red-600">{errors.email}</div>
                                                    ) : null}
                                                </div>

                                                <div className="flex flex-col gap-2">
                                                    <Input
                                                        name="token"
                                                        type="text"
                                                        placeholder="Entrez votre Code"
                                                        value={values.token}
                                                        onChange={handleChange}
                                                        onBlur={handleBlur}
                                                        aria-invalid={touched.token && !!errors.token}
                                                        className="h-12 border-tsa-blue placeholder:text-tsa-blue/90 placeholder:text-sm placeholder:font-medium"
                                                        required
                                                    />
                                                    {touched.token && errors.token ? (
                                                        <div className="text-sm text-red-600">{errors.token}</div>
                                                    ) : null}
                                                </div>

                                                <Button
                                                    type="submit"
                                                    className="w-4/5 justify-self-center flex h-12 bg-tsa-blue/90 text-white font-semibold text-2xl p-10"
                                                    disabled={isSubmitting}
                                                >
                                                    VÉRIFIER
                                                </Button>

                                                <div className="text-center">
                                                    <Link to="/" className="text-tsa-blue font-medium">
                                                        Retour à la connexion
                                                    </Link>
                                                </div>
                                            </Form>
                                        );
                                    }}
                                </Formik>
                            </CardContent>
                        </Card>
                    </div>
                </div>
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

export default VerifyEmail;
