import React from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import libphonenumber from 'google-libphonenumber';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import type { UserRole } from '@/types/user.types';
import type { RegisterRequest } from '@/types/auth.types';
import type { RegisterFormData } from '@/types/forms.types';
import { VALIDATION_MESSAGES } from '@/utils/validation';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import bg from '@/assets/register-background.png';
import logo from '@/assets/logo_white_bg.png';
import RedirectIfAuthenticated from '@/components/auth/RedirectIfAuthenticated';
import { authService } from '@/services/auth.service';
import toast from 'react-hot-toast';

const INITIAL_VALUES: RegisterFormData = {
    nom: '',
    prenom: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    country: 'cm',
    role: '',
};

const USER_ROLES: UserRole[] = ['affreteur', 'transporteur', 'admin'];

const Register: React.FC = () => {
    const navigate = useNavigate();

    const handleRegister = async (data: RegisterRequest) => {
        const response = await authService.register(data);

        if (response.error) {
            console.log(response.error.errors?.[0]);
            if (response.error.errors?.[0] === 'Invalid credentials') {
                toast.error('Email ou Mot de passe incorrect');
            } else if (response.error.errors?.[0] === 'Account is not active') {
                toast.error(`Compte inactif. Veuillez consulter vos mails à cet adresse : ${data.email}`);
            } else if (response.error.errors?.[0].message === 'The email has already been taken') {
                toast.error('Cette addresse mail est déjà associé à un compte');
            } else {
                toast.error(response.error.message || 'Échec de connexion');
            }
            return false;
        }

        if (!response.data) {
            toast.error('Réponse invalide du serveur');
            return false;
        }

        // Store email in localStorage for verification
        localStorage.setItem('verificationEmail', response.data.data.email);
        toast.success('Inscription réussie');
        navigate('/verify-email');
    };

    return (
        <RedirectIfAuthenticated>
            <div className="min-h-screen flex">
                {/* Left side - Form */}
                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="w-full xl:max-w-3/4 md:max-w-xl">
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Heureux de vous voir</h1>
                            <p className="text-gray-600">Vivez votre logistique en toute confiance</p>
                        </div>

                        <Card className="shadow-xl bg-[#D9D9D980]">
                            <CardContent className="p-8">
                                <Formik<RegisterFormData>
                                    initialValues={INITIAL_VALUES}
                                    validationSchema={Yup.object({
                                        nom: Yup.string().trim().required(VALIDATION_MESSAGES.REQUIRED_NAME),
                                        prenom: Yup.string().trim().required(VALIDATION_MESSAGES.REQUIRED_FIRSTNAME),
                                        email: Yup.string()
                                            .trim()
                                            .required(VALIDATION_MESSAGES.REQUIRED_EMAIL)
                                            .email(VALIDATION_MESSAGES.INVALID_EMAIL),
                                        password: Yup.string().required(VALIDATION_MESSAGES.REQUIRED_PASSWORD),
                                        confirmPassword: Yup.string()
                                            .required(VALIDATION_MESSAGES.REQUIRED_PASSWORD)
                                            .oneOf([Yup.ref('password')], VALIDATION_MESSAGES.PASSWORDS_NOT_MATCH),
                                        phone: Yup.string()
                                            .required(VALIDATION_MESSAGES.REQUIRED_PHONE)
                                            .test('isValidPhone', VALIDATION_MESSAGES.INVALID_PHONE, (value, context) => {
                                                try {
                                                    const phoneUtil = libphonenumber.PhoneNumberUtil.getInstance();
                                                    const countryCode = context.parent.country || 'CM'; // Default to Cameroon if not provided
                                                    const number = phoneUtil.parseAndKeepRawInput(
                                                        value,
                                                        countryCode.toUpperCase()
                                                    );
                                                    return phoneUtil.isValidNumber(number);
                                                } catch (error) {
                                                    console.error(error)
                                                    return false;
                                                }
                                            }),

                                        role: Yup.string()
                                            .required(VALIDATION_MESSAGES.REQUIRED_ROLE)
                                            .oneOf(USER_ROLES, VALIDATION_MESSAGES.INVALID_ROLE),
                                    })}
                                    onSubmit={async (data: RegisterFormData, { setSubmitting }) => {
                                        try {
                                            setSubmitting(true);
                                            await handleRegister({
                                                email: data.email.trim(),
                                                password: data.password,
                                                firstName: data.nom,
                                                lastName: data.prenom,
                                                phone: data.phone,
                                                role: data.role as UserRole,
                                            });
                                        } catch (error) {
                                            console.error('Register failed:', error);
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
                                        setValues,
                                        setFieldError,
                                        isSubmitting,
                                    }) => {
                                        const handleChangePhoneNumber = (
                                            value: string,
                                            country: { countryCode: string }
                                        ) => {
                                            const countryCode = country.countryCode.toLowerCase();
                                            setValues({
                                                ...values,
                                                phone: value,
                                                country: countryCode,
                                            });
                                        };

                                        return (
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
                                                            className="h-12 border-tsa-blue placeholder:text-tsa-blue/90 placeholder:text-sm placeholder:font-medium"
                                                            required
                                                        />
                                                        {touched.prenom && errors.prenom ? (
                                                            <div className="text-sm text-red-600">{errors.prenom}</div>
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
                                                        className="h-12 border-tsa-blue placeholder:text-tsa-blue/90 placeholder:text-sm placeholder:font-medium"
                                                        required
                                                    />
                                                    {touched.confirmPassword && errors.confirmPassword ? (
                                                        <div className="text-sm text-red-600">{errors.confirmPassword}</div>
                                                    ) : null}
                                                </div>

                                                <div className="flex flex-col gap-2">
                                                    <PhoneInput
                                                        specialLabel=""
                                                        placeholder="237 6 55 55 55 55"
                                                        country={'cm'}
                                                        enableSearch={true}
                                                        disableDropdown={false}
                                                        onChange={handleChangePhoneNumber}
                                                        onBlur={handleBlur}
                                                        value={values.phone}
                                                        masks={{
                                                            ci: '.. .. .. .. ..',
                                                            cm: '... ... ...',
                                                            fr: '. .. .. .. ..',
                                                            sn: '.. ... .. ..',
                                                            ma: '.... ......',
                                                            dz: '.. .. .. .. ..',
                                                            tn: '.. ... ...',
                                                        }}
                                                        inputStyle={{
                                                            color: 'var(--tsa-blue)',
                                                            fontWeight: '500',
                                                            fontSize: '15px',
                                                            height: '100%',
                                                            width: '100%',
                                                            padding: '0.25rem 3rem',
                                                            border: 'none',
                                                            outline: 'none',
                                                            backgroundColor: 'transparent',
                                                        }}
                                                        containerStyle={{
                                                            backgroundColor: 'transparent',
                                                            border: 'solid 1px var(--tsa-blue)',
                                                            borderRadius: '8px',
                                                            height: '3rem',
                                                        }}
                                                        buttonStyle={{
                                                            backgroundColor: 'transparent',
                                                            border: 'none',
                                                            borderRight: '1px solid var(--tsa-blue)',
                                                        }}
                                                        dropdownStyle={{
                                                            border: '1px solid var(--tsa-blue)',
                                                            borderRadius: '8px',
                                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                                            position: 'absolute',
                                                            top: '100%',
                                                            left: '0',
                                                            right: '0',
                                                        }}
                                                    />
                                                    {errors.phone && (
                                                        <p className="text-red-500 text-sm mt-1" role="alert">
                                                            {errors.phone}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="flex flex-col gap-2">
                                                    <Label className="text-sm font-medium text-tsa-blue/90 flex">
                                                        Votre Rôle
                                                    </Label>
                                                    <div className="w-full flex flex-1 justify-between max-sm:grid max-sm:grid-cols max-sm:justify-center max-sm:gap-4">
                                                        {USER_ROLES.map((role) => (
                                                            <Checkbox
                                                                key={role}
                                                                checked={values.role === role}
                                                                onCheckedChange={() =>
                                                                    setFieldValue('role', values.role === role ? '' : role)
                                                                }
                                                                onError={() =>
                                                                    setFieldError('role', VALIDATION_MESSAGES.REQUIRED_ROLE)
                                                                }
                                                                label={role.charAt(0).toUpperCase() + role.slice(1)}
                                                                className="rounded-none"
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
                                                    disabled={isSubmitting || Object.keys(errors).length > 0}
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
                                        );
                                    }}
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

export default Register;
