import { FC } from "react";
import SvgGo from '../../assets/right-arrow.svg?react'
import { useNavigate } from "react-router-dom";
import { object, string, ref } from 'yup'
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup"
import PasswordWarnings from "./warning";
import { observer } from "mobx-react";

const formSchema = object({
  password: string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
  confirmPassword: string()
    .oneOf([ref('password'), ''], 'Passwords must match')
    .required('Confirm password is required'),
})

const CreatePasswordPage: FC = observer(() => {
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(formSchema),
  })

  const handleConfirm = handleSubmit((values) => {
    // TODO:
    alert(JSON.stringify(values))
  })

  return (
    <div className="h-full relative">
      <div className="flex items-center gap-2">
        <button className="btn btn-ghost btn-square btn-sm items-center" onClick={() => navigate(-1)}>
          <SvgGo className="size-6 rotate-180" />
        </button>
        <span className="text-xs">Set wallet password</span>
      </div>
      <div className="mt-6">
        <label className="form-control w-full">
          <div className="label">
            <span className="label-text text-neutral text-xs">Wallet Password</span>
          </div>
          <input
            {...register('password')}
            className="input input-sm w-full h-8 text-xs"
            type="password"
          />
          {errors.password && (
            <div className="label">
              <span className="label-text-alt text-error">{errors.password.message}</span>
            </div>
          )}
        </label>
      </div>
      <div className="mt-6">
        <label className="form-control w-full">
          <div className="label">
            <span className="label-text text-neutral text-xs">Confirm Wallet Password</span>
          </div>
          <input
            {...register('confirmPassword')}
            className="input input-sm w-full h-8 text-xs"
            type="password"
          />
          {errors.confirmPassword && (
            <div className="label">
              <span className="label-text-alt text-error">{errors.confirmPassword.message}</span>
            </div>
          )}
        </label>
      </div>
      <div className="mt-6">
        <PasswordWarnings />
      </div>

      <button
        className="btn btn-block btn-sm absolute bottom-0"
        onClick={handleConfirm}
      >
        Confirm
      </button>
    </div>
  )
})

export default CreatePasswordPage;
