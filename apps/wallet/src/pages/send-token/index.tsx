import { observer } from "mobx-react";
import { FC, useEffect, useMemo, useState } from "react";
import hibitIdSession from "../../stores/session";
import { useNavigate, useParams } from "react-router-dom";
import { useTokenBalanceQuery, useTokenQuery } from "../../apis/react-query/token";
import TokenSelect from "../../components/TokenSelect";
import { RootAssetInfo } from "../../apis/models";
import BigNumber from "bignumber.js";
import { formatNumber } from "../../utils/formatter";
import LoaderButton from "../../components/LoaderButton";
import { object, string } from "yup";
import { walletAddressValidate } from "../../utils/validator";
import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, useForm } from "react-hook-form";
import { SYSTEM_MAX_DECIMALS } from "../../utils/formatter/numberFormatter";
import { sendTokenStore, useFeeQuery } from "./store";
import PageHeader from "../../components/PageHeader";
import { useTranslation } from "react-i18next";

const SendTokenPage: FC = observer(() => {
  const { addressOrSymbol } = useParams()
  const { state, setState } = sendTokenStore
  const [token, setToken] = useState<RootAssetInfo | null>(null)
  const navigate = useNavigate()
  const { t } = useTranslation()
  
  const tokenQuery = useTokenQuery(addressOrSymbol ?? '')
  const balanceQuery = useTokenBalanceQuery(token || undefined)

  const formSchema = useMemo(() => {
    return object({
      toAddress: string()
        .required(t('page_send_errAddressRequired'))
        .test('address', t('page_send_errInvalidAddress'), (value) => {
          if (!token) return true
          return walletAddressValidate(token.chain, value)
        }),
      amount: string()
        .required(t('page_send_errAmountRequired'))
        .test({
          message: t('page_send_errAmountTooSmall'),
          test: (value) => {
            return !!value && new BigNumber(value).gt(0)
          },
        })
        .test({
          message: t('page_send_errInsufficientBalance'),
          test: (value) => {
            if (!balanceQuery.data) return true
            return !!value && new BigNumber(value).lte(balanceQuery.data)
          },
        })
    })
  }, [token, balanceQuery.data])

  const {
    setValue,
    trigger,
    register,
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    defaultValues: {
      toAddress: state.toAddress || '',
      amount: state.amount || '',
    },
    resolver: yupResolver(formSchema),
    mode: 'onChange'
  })
  const values = watch()

  useFeeQuery(values.toAddress, values.amount, token)

  useEffect(() => {
    if (state.token) {
      setToken(state.token)
    } else if (tokenQuery.data) {
      setToken(tokenQuery.data)
    }
  }, [state.token, tokenQuery.data])

  const handleSend = handleSubmit(async ({ toAddress, amount }) => {
    if (!hibitIdSession.walletPool || !token) {
      return
    }
    setState({
      toAddress,
      token,
      amount,
    })
    navigate('/send/confirm')
  })

  return (
    <div className="h-full px-6 flex flex-col gap-6 overflow-auto">
      <PageHeader title={t('page_send_title')} onBeforeBack={() => sendTokenStore.reset()} />
      <div className="flex-1 flex flex-col gap-6">
        <div>
          <label className="form-control w-full">
            <div className="label">
              <span className="label-text text-neutral text-sm font-bold">
                {t('page_send_field_sendTo')}
              </span>
            </div>
            <textarea
              placeholder={t('page_send_field_sendTo_placeholder')}
              className="textarea w-full h-16 text-xs"
              {...register('toAddress')}
            />
            {errors.toAddress && (
              <div className="label">
                <span className="label-text-alt text-error">{errors.toAddress.message}</span>
              </div>
            )}
          </label>
        </div>
        <div>
          <div className="form-control w-full">
            <div className="label">
              <span className="label-text text-neutral text-sm font-bold">
                {t('page_send_field_amount')}
              </span>
              <span className="label-text-alt text-xs">
                <button
                  className="btn btn-link btn-xs px-0 no-underline gap-0"
                  onClick={() => {
                    setValue('amount', balanceQuery.data?.toString() ?? '0')
                    trigger('amount')
                  }}
                >
                  {t('common_max')}:
                  {balanceQuery.isLoading ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    <span className="mx-1">{formatNumber(balanceQuery.data || 0)}</span>
                  )}
                  {token?.assetSymbol}
                </button>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <TokenSelect
                value={token}
                onChange={(val) => {
                  setToken(val)
                  setTimeout(() => {
                    setValue('amount', '')
                    trigger('amount')
                  })
                }}
              />
              <Controller
                name="amount"
                control={control}
                render={({ field }) => (
                  <input
                    type="number"
                    min={0}
                    className="input input-sm w-full text-xs"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value
                      const [, decimals] = value.split('.')
                      if (decimals?.length > Math.min(SYSTEM_MAX_DECIMALS, token?.decimalPlaces?.value ?? Infinity)) {
                        return
                      }
                      setValue('amount', value)
                      trigger('amount')
                    }}
                  />
                )}
              />
            </div>
            {errors.amount && (
              <div className="label">
                <span className="label-text-alt text-error">{errors.amount.message}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <LoaderButton
        className="btn btn-block btn-sm disabled:opacity-70"
        onClick={handleSend}
      >
        {t('common_send')}
      </LoaderButton>
    </div>
  )
})

export default SendTokenPage
