import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ForgotPasswordFormData } from '@/types';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { VALIDATION_MESSAGES } from '@/utils/validation';

const INITIAL_VALUES: ForgotPasswordFormData = {
    email: ''
};

const validationSchema = Yup.object({
    email: Yup.string()
        .email(VALIDATION_MESSAGES.INVALID_EMAIL)
        .required(VALIDATION_MESSAGES.REQUIRED_EMAIL)
});

interface ForgotPasswordFormProps {
    onSubmit: (data: ForgotPasswordFormData) => Promise<void>;
    isSubmitting?: boolean;
    isSubmitted?: boolean;
}

export default function ForgotPasswordForm({
    onSubmit,
    isSubmitting = false,
    isSubmitted = false
}: ForgotPasswordFormProps) {
    return (
        <Formik<ForgotPasswordFormData>
            initialValues={INITIAL_VALUES}
            validationSchema={validationSchema}
            onSubmit={onSubmit}
            validateOnBlur={true}
            validateOnChange={true}
        >
            {({
                values,
                errors,
                touched,
                handleChange,
                handleBlur,
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
                                className="h-12 border-tsa-blue placeholder:text-tsa-blue/90 placeholder:text-sm placeholder:font-medium"
                                required
                            />
                            {touched.email && errors.email ? (
                                <div className="text-sm text-red-600">{errors.email}</div>
                            ) : null}
                        </div>

                        <Button
                            type="submit"
                            className="w-4/5 justify-self-center flex h-12 bg-tsa-blue/90 text-white font-semibold text-2xl p-10"
                            loading={isSubmitting}
                            disabled={isSubmitting}
                        >
                            ENVOYER LE LIEN
                        </Button>

                        <div className="text-center">
                            <Link to="/" className="text-tsa-blue font-medium">
                                ← Retour à la connexion
                            </Link>
                        </div>
                    </Form>
                )
            )}
        </Formik>
    );
}
