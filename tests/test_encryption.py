import unittest
import tenseal as ts
import base64

class TestEncryption(unittest.TestCase):
    @staticmethod
    def write_data(file_path, data):
        with open(file_path, "wb") as f:
            f.write(data)
    def test_encryption_decryption(self):
        # Crear un contexto
        context = ts.context(ts.SCHEME_TYPE.CKKS, 8192, coeff_mod_bit_sizes=[60, 40, 40, 60])
        context.generate_galois_keys()
        context.global_scale = 2**40
        secret_context = context.serialize(save_secret_key=True)
        TestEncryption.write_data("keys/secret.txt", secret_context) 
        # Valor original
        original_value = 12345
        
        # Encriptar el valor
        encrypted_value = ts.ckks_vector(context, [original_value])
        
        # Serializar el valor encriptado
        encrypted_serialized = encrypted_value.serialize()
        
        # # Convertir a Base64
        # encrypted_base64 = base64.b64encode(encrypted_serialized)

        # # Convertir de Base64 a binario
        # encrypted_binary = base64.b64decode(encrypted_base64)

        # Deserializar el valor encriptado
        encrypted_deserialized = ts.ckks_vector_from(context, encrypted_serialized)
        
        # Desencriptar el valor
        decrypted_value = encrypted_deserialized.decrypt()[0]

        # Verificar que el valor desencriptado es muy cercano al valor original
        self.assertAlmostEqual(original_value, decrypted_value, places=5)

if __name__ == '__main__':
    unittest.main()
