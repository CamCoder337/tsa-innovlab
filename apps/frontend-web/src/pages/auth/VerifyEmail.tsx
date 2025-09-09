import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { VALIDATION_MESSAGES } from '@/utils/validation';
import bg from '@/assets/login-background.png'
import logo from '@/assets/logo_white_bg.png'
import RedirectIfAuthenticated from '@/components/auth/RedirectIfAuthenticated'

type VerifyForm = { code: string; email: string }

const INITIAL_VALUES: VerifyForm = { email: '', code: '' }

const VerifyEmail: React.FC = () => {
    return (
        <RedirectIfAuthenticated>
            <div className="min-h-screen flex">
                <div className="flex-1 flex items-center justify-center p-8 md:mr-8">
                    <div className="w-full xl:max-w-3/4 md:max-w-xl">
                        <div className="text-center mb-8">
                            <h1 className="text-4xl font-medium mb-2 text-tsa-blue">
                                Vérification Email
                            </h1>
                            <p className="text-sm font-semibold text-tsa-gray">
                                Saisissez votre email et le code reçu pour vérifier votre compte
                            </p>
                        </div>

                        <Card className="shadow-xl bg-[#D9D9D980]">
                            <CardContent className="px-8">
                                <Formik<VerifyForm>
                                    initialValues={INITIAL_VALUES}
                                    validationSchema={Yup.object({
                                        email: Yup.string()
                                            .trim()
                                            .required(VALIDATION_MESSAGES.REQUIRED_EMAIL)
                                            .email(VALIDATION_MESSAGES.INVALID_EMAIL),
                                        code: Yup.string().trim().required('Code requis'),
                                    })}
                                    onSubmit={async () => { }}
                                    validateOnBlur={true}
                                    validateOnChange={true}
                                >
                                    {({ values, errors, touched, handleChange, handleBlur, isSubmitting }) => (
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
                                                    name="code"
                                                    type="text"
                                                    placeholder="Entrez votre Code"
                                                    value={values.code}
                                                    onChange={handleChange}
                                                    onBlur={handleBlur}
                                                    aria-invalid={touched.code && !!errors.code}
                                                    className="h-12 border-tsa-blue placeholder:text-tsa-blue/90 placeholder:text-sm placeholder:font-medium"
                                                    required
                                                />
                                                {touched.code && errors.code ? (
                                                    <div className="text-sm text-red-600">{errors.code}</div>
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
                                    )}
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


