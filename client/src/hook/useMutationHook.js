import { useMutation } from '@tanstack/react-query';

export const useMutationHook = (funCallback) => {
  const mutation = useMutation({
    mutationFn: funCallback,
    onError: (error) => {
      console.error('Mutation error:', error);
      alert(error.message || 'Đã xảy ra lỗi.');
    },
  });
  return mutation;
};
