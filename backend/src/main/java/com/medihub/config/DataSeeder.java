package com.medihub.config;

import com.medihub.model.Appointment;
import com.medihub.model.Doctor;
import com.medihub.model.Notification;
import com.medihub.model.Role;
import com.medihub.model.User;
import com.medihub.repository.AppointmentRepository;
import com.medihub.repository.DoctorRepository;
import com.medihub.repository.InventoryRepository;
import com.medihub.repository.NotificationRepository;
import com.medihub.repository.PharmacyProductRepository;
import com.medihub.repository.UserRepository;
import com.medihub.model.InventoryItem;
import com.medihub.model.PharmacyProduct;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

    private static final Set<String> DEMO_DOCTOR_EMAILS = Set.of(
        "michael.brown@medihub.com",
        "emily.chen@medihub.com",
        "james.wilson@medihub.com",
        "sarah.smith@medihub.com"
    );

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private PharmacyProductRepository pharmacyProductRepository;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        cleanupSeededDoctorData();

        // Seed admin user if not exists
        if (!userRepository.existsByEmail("admin@example.com")) {
            seedAdmin();
        }

        seedPharmacyProducts();
        seedInventoryItems();
    }

    private void seedInventoryItems() {
        if (inventoryRepository.count() > 0) {
            return;
        }

        List<InventoryItem> items = new ArrayList<>();
        
        InventoryItem i1 = new InventoryItem();
        i1.setName("Surgical Masks");
        i1.setStock(500);
        items.add(i1);

        InventoryItem i2 = new InventoryItem();
        i2.setName("Gloves (Box)");
        i2.setStock(200);
        items.add(i2);

        InventoryItem i3 = new InventoryItem();
        i3.setName("Syringes 5ml");
        i3.setStock(1000);
        items.add(i3);
        
        // Also add the medicines as inventory items just in case they are tracked here too
        InventoryItem i4 = new InventoryItem();
        i4.setName("Paracetamol Stock");
        i4.setStock(1000);
        items.add(i4);

        inventoryRepository.saveAll(items);
        System.out.println("✓ Successfully seeded " + items.size() + " inventory items.");
    }


    private void seedPharmacyProducts() {
        if (pharmacyProductRepository.count() > 0) {
            return;
        }

        List<PharmacyProduct> products = new ArrayList<>();

        PharmacyProduct p1 = new PharmacyProduct();
        p1.setName("Paracetamol 500mg");
        p1.setGenericName("Paracetamol");
        p1.setCategory("Pain Relief");
        p1.setDescription("Effective pain reliever and fever reducer.");
        p1.setPrice(new BigDecimal("5.50"));
        p1.setStockQuantity(100);
        p1.setAvailableQuantity(100);
        p1.setIsActive(true);
        p1.setImageUrl("https://example.com/paracetamol.jpg");
        products.add(p1);

        PharmacyProduct p2 = new PharmacyProduct();
        p2.setName("Amoxicillin 250mg");
        p2.setGenericName("Amoxicillin");
        p2.setCategory("Antibiotics");
        p2.setDescription("Broad-spectrum antibiotic used to treat bacterial infections.");
        p2.setPrice(new BigDecimal("12.00"));
        p2.setStockQuantity(50);
        p2.setAvailableQuantity(50);
        p2.setIsActive(true);
        p2.setImageUrl("https://example.com/amoxicillin.jpg");
        products.add(p2);

        PharmacyProduct p3 = new PharmacyProduct();
        p3.setName("Ibuprofen 400mg");
        p3.setGenericName("Ibuprofen");
        p3.setCategory("Anti-inflammatory");
        p3.setDescription("Nonsteroidal anti-inflammatory drug (NSAID) used for treating pain, fever, and inflammation.");
        p3.setPrice(new BigDecimal("8.75"));
        p3.setStockQuantity(75);
        p3.setAvailableQuantity(75);
        p3.setIsActive(true);
        p3.setImageUrl("https://example.com/ibuprofen.jpg");
        products.add(p3);

        PharmacyProduct p4 = new PharmacyProduct();
        p4.setName("Cetirizine 10mg");
        p4.setGenericName("Cetirizine");
        p4.setCategory("Antihistamine");
        p4.setDescription("Used to relieve allergy symptoms such as watery eyes, runny nose, itching eyes/nose, sneezing, hives, and itching.");
        p4.setPrice(new BigDecimal("4.20"));
        p4.setStockQuantity(120);
        p4.setAvailableQuantity(120);
        p4.setIsActive(true);
        p4.setImageUrl("https://example.com/cetirizine.jpg");
        products.add(p4);

        PharmacyProduct p5 = new PharmacyProduct();
        p5.setName("Metformin 500mg");
        p5.setGenericName("Metformin");
        p5.setCategory("Antidiabetic");
        p5.setDescription("Used to treat type 2 diabetes.");
        p5.setPrice(new BigDecimal("6.00"));
        p5.setStockQuantity(60);
        p5.setAvailableQuantity(60);
        p5.setIsActive(true);
        p5.setImageUrl("https://example.com/metformin.jpg");
        products.add(p5);

        pharmacyProductRepository.saveAll(products);
        System.out.println("✓ Successfully seeded " + products.size() + " pharmacy products.");
    }


    private void seedAdmin() {
        User admin = new User();
        admin.setName("Admin User");
        admin.setEmail("admin@example.com");
        admin.setPassword(passwordEncoder.encode("admin123"));
        admin.setRole(Role.ADMIN);
        admin.setActive(true);
        userRepository.save(admin);
        System.out.println("✓ Successfully seeded admin user (admin@example.com).");
    }

    private void cleanupSeededDoctorData() {
        for (String email : DEMO_DOCTOR_EMAILS) {
            Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isEmpty()) {
                continue;
            }

            User user = userOpt.get();

            try {
                Optional<Doctor> doctorOpt = doctorRepository.findByUserId(user.getId());
                if (doctorOpt.isPresent()) {
                    Doctor doctor = doctorOpt.get();

                    List<Appointment> doctorAppointments = appointmentRepository.findByDoctorId(doctor.getId());
                    if (!doctorAppointments.isEmpty()) {
                        appointmentRepository.deleteAll(doctorAppointments);
                    }

                    doctorRepository.delete(doctor);
                }

                List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
                if (!notifications.isEmpty()) {
                    notificationRepository.deleteAll(notifications);
                }

                userRepository.delete(user);
                System.out.println("✓ Removed seeded demo doctor account: " + email);
            } catch (Exception ex) {
                // Fallback: keep row but deactivate it, so it does not impact realtime flows.
                user.setActive(false);
                userRepository.save(user);
                System.out.println("! Could not hard-delete seeded account " + email + ". Marked inactive instead.");
            }
        }
    }
}
