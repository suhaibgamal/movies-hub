const CurrentYear = () => new Date().getFullYear();

function Footer() {
  return (
    <footer className="flex justify-center items-center bg-card p-4 w-full">
      <p className="text-muted-foreground text-sm text-center">
        © {CurrentYear()} Movies Hub by Suhaib Gamal, All Rights Reserved
      </p>
    </footer>
  );
}

export default Footer;
