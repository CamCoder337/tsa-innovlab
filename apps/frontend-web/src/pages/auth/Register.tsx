import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import type { RegisterFormData, UserRole } from '@/types/auth.types';
import { VALIDATION_MESSAGES } from '@/utils/validation';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import bg from '@/assets/register-background.png'
import logo from '@/assets/logo_white_bg.png'

const INITIAL_VALUES: RegisterFormData = {
    nom: '',
    prenom: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: ''
};

const USER_ROLES: UserRole[] = ['Affréteur', 'Transporteur', 'Client'];

const Register: React.FC = () => {


    return (
        <div className="min-h-screen flex">
            {/* Left side - Form */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full xl:max-w-3/4 md:max-w-xl">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Heureux de vous voir
                        </h1>
                        <p className="text-gray-600">
                            Vivez votre logistique en toute confiance
                        </p>
                    </div>

                    <Card className="shadow-xl bg-[#D9D9D980]">
                        <CardContent className="p-8">
                            <Formik<RegisterFormData>
                                initialValues={INITIAL_VALUES}
                                validationSchema={Yup.object({
                                    nom: Yup.string()
                                        .trim()
                                        .required(VALIDATION_MESSAGES.REQUIRED_NAME),
                                    prenom: Yup.string()
                                        .trim()
                                        .required(VALIDATION_MESSAGES.REQUIRED_FIRSTNAME),
                                    email: Yup.string()
                                        .trim()
                                        .required(VALIDATION_MESSAGES.REQUIRED_EMAIL)
                                        .email(VALIDATION_MESSAGES.INVALID_EMAIL),
                                    password: Yup.string()
                                        .required(VALIDATION_MESSAGES.REQUIRED_PASSWORD),
                                    confirmPassword: Yup.string()
                                        .required(VALIDATION_MESSAGES.REQUIRED_PASSWORD)
                                        .oneOf([Yup.ref('password')], VALIDATION_MESSAGES.PASSWORDS_NOT_MATCH),
                                    role: Yup.string()
                                        .required(VALIDATION_MESSAGES.REQUIRED_ROLE)
                                        .oneOf(USER_ROLES, VALIDATION_MESSAGES.INVALID_ROLE),
                                })}
                                onSubmit={async (data: RegisterFormData) => {
                                    console.log('Registration data:', data);
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
                                    setFieldError,
                                    isSubmitting,
                                }) => (
                                    <Form className="space-y-8">
                                        <div className="grid md:grid-cols-2 md:gap-4 gap-8">
                                            <div className="flex flex-col gap-4">
                                                <Input
                                                    name="nom"
                                                    type="text"
                                                    placeholder="Entrez votre Nom"
                                                    value={values.nom}
                                                    onChange={handleChange}
                                                    onBlur={handleBlur}
                                                    aria-invalid={touched.nom && !!errors.nom}
                                                    className="h-12 border-tsa-blue placeholder:text-tsa-blue/90 placeholder:text-sm placeholder:font-medium"
                                                    required
                                                />
                                                {touched.nom && errors.nom ? (
                                                    <div className="text-sm text-red-600">{errors.nom}</div>
                                                ) : null}
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <Input
                                                    name="prenom"
                                                    type="text"
                                                    placeholder="Entrez votre Prénom"
                                                    value={values.prenom}
                                                    onChange={handleChange}
                                                    onBlur={handleBlur}
                                                    aria-invalid={touched.prenom && !!errors.prenom}
                                                    className="h-12 border-tsa-blue placeholder:text-tsa-blue/90 placeholder:text-sm placeholder:font-medium"
                                                    required
                                                />
                                                {touched.email && errors.email ? (
                                                    <div className="text-sm text-red-600">{errors.email}</div>
                                                ) : null}
                                            </div>
                                        </div>

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
                                            {touched.password && errors.password ? (
                                                <div className="text-sm text-red-600">{errors.password}</div>
                                            ) : null}
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <Input
                                                name="confirmPassword"
                                                type="password"
                                                placeholder="Confirmez votre Mot de passe"
                                                value={values.confirmPassword}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                aria-invalid={touched.confirmPassword && !!errors.confirmPassword}
                                                className="h-12 border-tsa-blue placeholder:text-tsa-blue/90 placeholder:text-sm placeholder:font-medium"
                                                required
                                            />
                                            {touched.confirmPassword && errors.confirmPassword ? (
                                                <div className="text-sm text-red-600">{errors.confirmPassword}</div>
                                            ) : null}
                                        </div>

                                        <div className='flex flex-col gap-2'>
                                            <Label className="text-sm font-medium text-tsa-blue/90 flex">
                                                Votre Rôle
                                            </Label>
                                            <div className="w-full flex flex-1 justify-between max-sm:grid max-sm:grid-cols max-sm:justify-center max-sm:gap-4">
                                                {USER_ROLES.map((role) => (
                                                    <Checkbox
                                                        key={role}
                                                        checked={values.role === role}
                                                        onCheckedChange={() => setFieldValue('role', values.role === role ? '' : role)}
                                                        onError={() => setFieldError('role', VALIDATION_MESSAGES.REQUIRED_ROLE)}
                                                        label={role}
                                                        className='rounded-none'
                                                        labelClassName="text-tsa-blue/90 text-sm font-medium"
                                                    />
                                                ))}
                                            </div>
                                            {touched.role && errors.role && (
                                                <p className="text-red-500 text-sm mt-1" role="alert">
                                                    {errors.role}
                                                </p>
                                            )}
                                        </div>

                                        <Button
                                            type="submit"
                                            className="w-full h-12 bg-tsa-blue/90 hover:bg-tsa-blue/95 text-white font-semibold text-base"
                                            loading={isSubmitting}
                                            disabled={isSubmitting}
                                        >
                                            JE M'INSCRIS
                                        </Button>

                                        <div className="text-center">
                                            <span className="text-gray-600">Un compte déjà existant ? </span>
                                            <Link to="/" className="text-tsa-blue hover:text-tsa-blue/95 font-medium">
                                                Je me connecte
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
        </div>
    );
};

export default Register;