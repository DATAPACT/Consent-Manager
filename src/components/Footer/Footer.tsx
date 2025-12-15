// css
import styles from "../../css/Footer.module.css";

function Footer() {
  return (
    <>
      <footer className={`${styles.footerComp} container-fluid py-5 mt-5`}>
        <div className="container text-center">
          <h4 className="text-dark" id="logo-footer">
            UPCAST | Consent Manager
          </h4>
          <p className="text-muted mt-2">
            <strong>© 2025 UPCAST. All rights reserved.</strong>
          </p>
          <p>
            This project has received funding from the European Union´s Horizon
            Research and Innovation Actions under Grant Agreement nº 101093216.
          </p>

          {/* <div className="d-flex flex-row mb-3">
            <div>
              <a id="footer-link" href="#">
                Terms of service
              </a>
            </div>
            <div className="ms-2">|</div>
            <div className="ms-2">
              <a id="footer-link" href="#">
                Privacy policy
              </a>
            </div>
            <div className="ms-2">|</div>
            <div className="ms-2">
              <a id="footer-link" href="#">
                Intellectual property
              </a>
            </div>
            <div className="ms-2">|</div>
            <div className="ms-2">
              <a id="footer-link" href="#">
                About
              </a>
            </div>
            <div className="ms-2">|</div>
            <div className="ms-2">
              <a id="footer-link" href="#">
                Report a bug
              </a>
            </div>
            <div className="ms-2">|</div>
            <div className="ms-2">
              <a id="footer-link" href="#">
                Help center
              </a>
            </div>
          </div> */}
        </div>
      </footer>
    </>
  );
}

export default Footer;
