package com.tfassih.babl.repositories;

import com.tfassih.babl.entities.UsersEntity;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.PagingAndSortingRepository;

public interface UserRepository extends CrudRepository<UsersEntity, Long>, PagingAndSortingRepository<UsersEntity, Long> {
}
