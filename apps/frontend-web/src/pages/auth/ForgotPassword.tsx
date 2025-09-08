import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ForgotPasswordFormData } from '@/types/auth.types';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { VALIDATION_MESSAGES } from '@/utils/validation';

const INITIAL_VALUES: ForgotPasswordFormData = {
    email: ''
};

interface ForgotPasswordProps { }

const ForgotPassword: React.FC<ForgotPasswordProps> = () => {
    const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 text-white rounded-lg text-2xl font- mb-4">
                        ✓
                    </div>
                    <h1 className="text-3xl font-bold text-tsa-blue mb-2">
                        {isSubmitted ? 'Email envoyé !' : 'Mot de passe oublié ?'}
                    </h1>
                    <p className="text-gray-600">
                        {isSubmitted ? 'Vérifiez votre boîte de réception pour réinitialiser votre mot de passe.' : 'Entrez votre email pour recevoir un lien de réinitialisation'}
                    </p>
                </div>
            </div>

            <Card className="shadow-xl bg-[#D9D9D980] md:w-2/5">
                <CardContent className="p-8">
                    <Formik<ForgotPasswordFormData>
                        initialValues={INITIAL_VALUES}
                        validationSchema={Yup.object({
                            email: Yup.string().email(VALIDATION_MESSAGES.INVALID_EMAIL).required(VALIDATION_MESSAGES.REQUIRED_EMAIL)
                        })}
                        onSubmit={async (data: ForgotPasswordFormData) => {
                            console.log('Forgot password data:', data);
                            setIsSubmitted(true)
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
                            isSubmitting,
                        }) => (
                            isSubmitted ? (
                                <>
                                    <p className="text-gray-600 mb-6">
                                        Un lien de réinitialisation a été envoyé à <strong>{values.email}</strong>
                                    </p>
                                    <Link to="/">
                                        <Button className="w-full h-12 bg-tsa-blue/90 text-white font-semibold">
                                            Retour à la connexion
                                        </Button>
                                    </Link>
                                </>
                            ) : (
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
                                            className="w-full h-12 border-tsa-blue placeholder:text-tsa-blue/90 placeholder:text-sm placeholder:font-medium"
                                            required
                                        />
                                        {touched.email && errors.email ? (
                                            <div className="text-sm text-red-600">{errors.email}</div>
                                        ) : null}
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full h-12 bg-tsa-blue/90 text-white font-semibold text-base"
                                        loading={isSubmitting}
                                        disabled={isSubmitting}
                                    >
                                        ENVOYER LE LIEN
                                    </Button>

                                    <div className="text-center">
                                        <Link to="/login" className="text-tsa-logo/90 hover:text-blue-700 font-medium">
                                            ← Retour à la connexion
                                        </Link>
                                    </div>
                                </Form>
                            )
                        )}
                    </Formik>
                </CardContent>
            </Card>
        </div >
    );
};

export default ForgotPassword;