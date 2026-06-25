"use client";

import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";

interface ErrorAlertProps {
  title: string;
  message: string;
  onClose: () => void;
}

export default function ErrorAlert(props: ErrorAlertProps) {
  return (
    <Dialog open={true} onClose={props.onClose} className="relative z-10">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-[#010A13] bg-opacity-95 transition-opacity"
      />
      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full justify-center p-4 text-center sm:items-center sm:p-0">
          <DialogPanel
            transition
            className="flex flex-col transform overflow-hidden bg-[#010A13] outline outline-[#C89B3C] text-left shadow-xl transition-all w-full max-w-3xl"
          >
            <div className="sm:flex m-auto">
              <div className="text-center">
                <div className="my-5 pt-4">
                  <p className="text-xl text-[#A09B8C] font-spiegel font-medium">
                    {props.message}
                  </p>
                </div>
              </div>
            </div>
            <div className="m-auto w-32 border-black border-2 outline outline-[#C89B3C] flex justify-center z-20 ring  ring-black">
              <button
                data-autofocus
                type="button"
                className="bg-gradient-to-t from-[#32281E] to-[#785A28] w-full py-2 text-2xl font-beaufort uppercase font-bold text-[#C8AA6E] hover:bg-gradient-to-t hover:from-[#32281E] hover:to-[#463714]"
                onClick={props.onClose}
              >
                EXIT
              </button>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
