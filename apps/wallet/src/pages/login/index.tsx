import { FC, useMemo, useState } from "react";
import { useIsDesktop } from "../../utils/hooks";
import LoginSteps from "./LoginSteps";
import rpcManager from "../../stores/rpc";
import Modal from "../../components/Modal";
import SvgLogo from '../../assets/logo.svg?react';
// @ts-ignore
import TelegramLoginButton from 'react-telegram-login';

const LoginPage: FC = () => {
  const [state, setState] = useState<'none' | 'create' | 'login'>('none')
  const isDesktop = useIsDesktop()

  const modalTitle = state === 'none'
    ? 'Hibit ID'
    : 'Login via passkey'

    const handleTelegramResponse = (response: any) => {
      console.log(JSON.stringify(response))
    }
  
  const initialContent = useMemo(() => (
    <div className="h-full flex flex-col items-center py-4">
      <div className="flex-1 flex justify-center items-center">
        <div className="flex justify-center items-center size-20 rounded-full [background:linear-gradient(180deg,#16D6FF_0%,#0099E6_100%)]">
          <SvgLogo className="size-9" />
        </div>
      </div>
      <div className="w-full flex-none flex flex-col gap-4 items-center">
        <TelegramLoginButton dataOnauth={handleTelegramResponse} botName="RustinLocalTestBot" dataUserpic={false} />
        <button className="btn btn-primary btn-sm btn-block" onClick={() => setState('login')}>
          Login
        </button>
        <button className="btn btn-sm btn-block" onClick={() => setState('create')}>
          Create
        </button>
      </div>
    </div>
  ), [])

  return isDesktop ? (
    <Modal
      visible
      title={modalTitle}
      onClose={() => rpcManager.onClose()}
      content={state === 'none' ? initialContent : (
        <LoginSteps isCreate={state === 'create'} />
      )}
      modalClassName={state === 'none' ? 'w-[480px]' : ''}
    />
  ) : (
    <div className="h-full">
      {state === 'none' ? initialContent : (
        <LoginSteps isCreate={state === 'create'} />
      )}
    </div>
  );
}

export default LoginPage;
