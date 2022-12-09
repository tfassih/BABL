package com.tfassih.babl;

import com.tfassih.babl.entities.UsersEntity;
import com.tfassih.babl.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DatabaseLoader implements CommandLineRunner {
    private final UserRepository userRepo;

    @Autowired
    public DatabaseLoader(UserRepository userRepo){
        this.userRepo = userRepo;
    }

    @Override
    public void run(String... strings) throws Exception {
        this.userRepo.save(new UsersEntity("personFace", "tim smith", "a spot"));
    }

}
