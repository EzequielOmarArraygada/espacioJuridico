function logout() {
  fetch('/api/sessions/logout')
    .then((res) => res.json())
    .then((result) => {
      if (result.success) window.location.href = '/login';
    })
    .catch((error) => {
      Swal.fire({
        title: 'Error',
        icon: 'error',
        text: error,
      });
    });
}
