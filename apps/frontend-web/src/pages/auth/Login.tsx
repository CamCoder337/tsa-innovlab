import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { LoginFormData } from '@/types/auth.types';
import { VALIDATION_MESSAGES } from '@/utils/validation';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import bg from '@/assets/login-background.png'
import logo from '@/assets/logo_white_bg.png'

const INITIAL_VALUES: LoginFormData = {
    email: '',
    password: ''
};

const Login: React.FC = () => {

    return (
        <div className="min-h-screen flex">
            {/* Left side - Form */}
            <div className="flex-1 flex items-center justify-center p-8 md:mr-8">
                <div className="w-full xl:max-w-3/4 md:max-w-xl">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-medium mb-2 text-tsa-blue">
                            Heureux de vous Revoir
                        </h1>
                        <p className="text-sm font-semibold text-tsa-gray">
                            Vivez votre logistique en toute confiance
                        </p>
                    </div>

                    <Card className="shadow-xl bg-[#D9D9D980]">
                        <CardContent className="px-8">
                            <Formik<LoginFormData>
                                initialValues={INITIAL_VALUES}
                                validationSchema={Yup.object({
                                    email: Yup.string()
                                        .trim()
                                        .required(VALIDATION_MESSAGES.REQUIRED_EMAIL)
                                        .email(VALIDATION_MESSAGES.INVALID_EMAIL),
                                    password: Yup.string()
                                        .required(VALIDATION_MESSAGES.REQUIRED_PASSWORD)
                                })}
                                onSubmit={async (data: LoginFormData) => {
                                    console.log('Login data:', data);
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
                                            />
                                            <div className="flex justify-between">
                                                <div className="w-1/2 text-sm text-red-600">
                                                    {touched.password && errors.password ? errors.password : null}{ }
                                                </div>
                                                <Link to="/forgot-password" className="text-tsa-blue text-sm font-medium">
                                                    Mot de passe oublié ?
                                                </Link>
                                            </div>
                                        </div>

                                        <Button
                                            type="submit"
                                            className="w-4/5 justify-self-center flex h-12 bg-tsa-blue/90 text-white font-semibold text-2xl p-10"
                                            disabled={isSubmitting}
                                        >
                                            JE ME CONNECTE
                                        </Button>

                                        <div className="text-center">
                                            <span className="text-gray-600">Pas encore de compte ? </span>
                                            <Link to="/register" className="text-tsa-blue font-medium">
                                                Je m'inscris
                                            </Link>
                                        </div>
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
        </div >
    );
};

export default Login;